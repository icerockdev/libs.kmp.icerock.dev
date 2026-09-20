/*
 * Copyright 2021 IceRock MAG Inc. Use of this source code is governed by the Apache 2.0 license.
 */

package dev.icerock.kotlin.libraries.fetcher

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class LibraryInfo(
    val groupId: String,
    val artifactId: String,
    val path: String,
    val latestVersion: String,
    val lastUpdated: String,
    val versions: List<Version>,
    val github: GitHub? = null,
    val category: String? = null
) {
    @Serializable
    data class Version(
        val version: String,
        val mpp: Boolean,
        val gradle: String?,
        val kotlin: String?,
        val targets: Map<String, Target>
    )

    @Serializable
    data class Target(
        val platform: String,
        val target: String? = null
    )

    @Serializable
    data class GitHub(
        val name: String,
        @SerialName("full_name")
        val fullName: String,
        @SerialName("html_url")
        val htmlUrl: String,
        val description: String,
        @SerialName("stars_count")
        val starsCount: Int,
        val topics: List<String>
    )
}
