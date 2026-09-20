/*
 * Copyright 2021 IceRock MAG Inc. Use of this source code is governed by the Apache 2.0 license.
 */

package dev.icerock.kotlin.libraries.fetcher

import com.gitlab.mvysny.konsumexml.konsumeXml
import io.ktor.client.HttpClient
import io.ktor.client.request.get
import io.ktor.client.request.parameter
import io.ktor.client.request.url
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonPrimitive

class Fetcher(
    private val json: Json,
    private val httpClient: HttpClient,
    private val searchPageSize: Int = 1000
) {

    suspend fun fetch(): List<LibraryInfo> {
        val libs: List<LibraryInfo> = coroutineScope {
            searchAllPages()
                .getOrThrow()
                .map { async { docToLibraryInfo(it) } }
                .awaitAll()
                .mapNotNull { it }
        }
        return libs.map { it.path }.toSortedSet().map { path ->
            libs.first { it.path == path }
        }
    }

    private suspend fun searchAllPages(): Result<List<SearchResult.Doc>> {
        var pageNumber = 0
        val results = mutableListOf<SearchResult.Doc>()
        while (true) {
            val page: SearchResult = searchPage(page = pageNumber, limit = searchPageSize).getOrElse {
                return Result.failure(it)
            }

            val items: List<SearchResult.Doc> = page.response.docs
            results.addAll(items)
            if (items.size < searchPageSize) break
            else pageNumber++
        }

        return Result.success(results)
    }

    private suspend fun searchPage(page: Int, limit: Int): Result<SearchResult> {
        return runCatching {
            httpClient.get<String> {
                url("https://search.maven.org/solrsearch/select")
                parameter("q", "l:metadata")
                parameter("start", page * limit)
                parameter("rows", limit)
            }
        }.map { json.decodeFromString(SearchResult.serializer(), it) }
    }

    private suspend fun docToLibraryInfo(doc: SearchResult.Doc): LibraryInfo? {
        val metadata: GradleMetadata = getGradleMetadata(
            group = doc.group,
            artifact = doc.artifact,
            version = doc.version
        ).getOrElse {
            println("can't load gradle metadata for ${doc.id} because $it")
            return null
        }
        val commonVariant: GradleMetadata.Variant? = metadata.variants.firstOrNull { variant ->
            variant.attributes[GradleMetadata.Attributes.KOTLIN_PLATFORM_TYPE.key]?.contentOrNull == "common"
        }
        if (commonVariant == null) {
            println("can't find common variant for ${doc.id}")
            return null
        }
        val commonLocation: GradleMetadata.Location? = commonVariant.availableAt
        if (commonLocation == null) {
            println("can't find common location for $commonVariant")
            return null
        }

        val commonMavenMetadata: MavenMetadata = getMavenMetadata(
            group = commonLocation.group,
            artifact = commonLocation.module
        ).getOrElse {
            println("can't load common maven-metadata for $commonLocation because $it")
            return null
        }

        val latestVersion: String = commonMavenMetadata.versioning.latest
        val lastUpdated: Long = commonMavenMetadata.versioning.lastUpdated

        val group = commonLocation.group
        val artifact = commonLocation.module

        return LibraryInfo(
            groupId = group,
            artifactId = artifact,
            path = "$group:$artifact",
            latestVersion = latestVersion,
            lastUpdated = lastUpdated.toString(),
            versions = coroutineScope {
                commonMavenMetadata.versioning
                    .versions
                    // TODO remove take last 2 versions
                    .takeLast(2)
                    .map { async { getVersionInfo(location = commonLocation, version = it) } }
                    .awaitAll()
                    .mapNotNull { result ->
                        result.getOrElse {
                            println("can't load version info for $commonLocation because $it")
                            null
                        }
                    }
            }
        )
    }

    private suspend fun getVersionInfo(
        location: GradleMetadata.Location,
        version: String
    ): Result<LibraryInfo.Version> {
        return getGradleMetadata(
            group = location.group,
            artifact = location.module,
            version = version
        ).map { commonMetadata ->
            LibraryInfo.Version(
                version = version,
                mpp = true,
                gradle = commonMetadata.createdBy["gradle"]?.version,
                kotlin = getKotlinVersion(commonMetadata),
                targets = commonMetadata.variants.mapNotNull { variant ->
                    val targetInfo: LibraryInfo.Target? = getLibraryInfoTarget(variant)
                    if (targetInfo == null) {
                        println("can't read target info for variant $variant")
                        null
                    } else {
                        targetInfo.let { variant.name to it }
                    }
                }.toMap()
            )
        }
    }

    private fun getKotlinVersion(gradleMetadata: GradleMetadata): String? {
        val stdLib: GradleMetadata.Dependency? = gradleMetadata.variants
            .mapNotNull { it.dependencies }
            .flatten()
            .firstOrNull { dependency ->
                dependency.group == "org.jetbrains.kotlin" && dependency.module.startsWith("kotlin-stdlib")
            }

        if (stdLib == null) {
            println("can't read kotlin version without stdlib in $gradleMetadata")
            return null
        }

        if (stdLib.version == null) {
            println("can't read kotlin version without version of stdlib in $stdLib")
            return null
        }

        val resolved: String? = stdLib.version.resolved

        if (resolved == null) {
            println("can't read kotlin version without versioning of stdlib in $stdLib")
            return null
        }

        return resolved
    }

    private fun getLibraryInfoTarget(variant: GradleMetadata.Variant): LibraryInfo.Target? {
        return LibraryInfo.Target(
            platform = variant.attributes[GradleMetadata.Attributes.KOTLIN_PLATFORM_TYPE.key]?.contentOrNull
                ?: return null,
            target = variant.attributes[GradleMetadata.Attributes.KOTLIN_NATIVE_TARGET.key]?.contentOrNull
        )
    }

    private suspend fun getMavenMetadata(group: String, artifact: String): Result<MavenMetadata> {
        val groupPath = group.replace('.', '/')
        val mavenBase = "https://repo1.maven.org/maven2/$groupPath/$artifact"
        val metadataUrl = "$mavenBase/maven-metadata.xml"

        return runCatching {
            httpClient.get<String> {
                url(metadataUrl)
            }
        }.map { content ->
            with(content.konsumeXml()) {
                child("metadata") {
                    val groupId: String = childText("groupId")
                    val artifactId: String = childText("artifactId")

                    val versioning: MavenMetadata.Versioning = child("versioning") {
                        val latest: String = childText("latest")
                        val release: String = childText("release")
                        val versions: List<String> = child("versions") {
                            childrenText("version")
                        }
                        val lastUpdated: String = childText("lastUpdated")
                        MavenMetadata.Versioning(
                            latest = latest,
                            release = release,
                            lastUpdated = lastUpdated.toLong(),
                            versions = versions
                        )
                    }

                    MavenMetadata(
                        groupId = groupId,
                        artifactId = artifactId,
                        versioning = versioning
                    )
                }
            }
        }
    }

    private suspend fun getGradleMetadata(
        group: String,
        artifact: String,
        version: String
    ): Result<GradleMetadata> {
        val groupPath = group.replace('.', '/')
        val mavenBase = "https://repo1.maven.org/maven2/$groupPath/$artifact/$version"
        val gradleMetadataUrl = "$mavenBase/$artifact-$version.module"

        return runCatching {
            httpClient.get<String> {
                url(gradleMetadataUrl)
            }
        }.map { json.decodeFromString(GradleMetadata.serializer(), it) }
    }

    private val JsonElement?.contentOrNull: String? get() = (this as? JsonPrimitive)?.content
}
