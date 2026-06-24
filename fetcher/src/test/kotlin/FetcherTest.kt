/*
 * Copyright 2021 IceRock MAG Inc. Use of this source code is governed by the Apache 2.0 license.
 */

import dev.icerock.kotlin.libraries.fetcher.Fetcher
import dev.icerock.kotlin.libraries.fetcher.LibraryInfo
import io.ktor.client.HttpClient
import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respondBadRequest
import io.ktor.client.engine.mock.respondOk
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.json.Json
import kotlin.test.Test
import kotlin.test.assertEquals

class FetcherTest {

    @Test
    fun `successful fetch`() {
        val httpClient = HttpClient(MockEngine) {
            engine {
                addHandler { request ->
                    val url = request.url.toString()
                    val tweedleDir = "https://repo1.maven.org/maven2/io/github/tyczj/"
                    when {
                        url == "https://search.maven.org/solrsearch/select?q=l%3Ametadata&start=0&rows=20" -> {
                            respondOk(readMock("search-result.json"))
                        }
                        url.startsWith(tweedleDir) -> {
                            val resourcePath: String = url.removePrefix(tweedleDir)
                            respondOk(readMock("tyczj/$resourcePath"))
                        }
                        else -> {
                            respondBadRequest()
                        }
                    }
                }
            }
        }
        val fetcher = Fetcher(
            json = Json {
                ignoreUnknownKeys = true
            },
            httpClient = httpClient,
            searchPageSize = 20
        )
        val result = runBlocking { fetcher.fetch() }

        assertEquals(
            expected = listOf(
                LibraryInfo(
                    groupId = "io.github.tyczj",
                    artifactId = "tweedle",
                    path = "io.github.tyczj:tweedle",
                    latestVersion = "0.3.4",
                    lastUpdated = "20210530012749",
                    versions = result.first().versions
                )
            ),
            actual = result
        )
    }

    private fun readMock(name: String): String {
        val resource = this.javaClass.getResourceAsStream(name)
            ?: throw IllegalArgumentException("can't find $name in resources")
        return resource.readAllBytes().decodeToString()
    }
}
