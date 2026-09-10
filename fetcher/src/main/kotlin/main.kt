/*
 * Copyright 2021 IceRock MAG Inc. Use of this source code is governed by the Apache 2.0 license.
 */

package dev.icerock.kotlin.libraries.fetcher

import io.ktor.client.HttpClient
import io.ktor.client.engine.cio.CIO
import io.ktor.client.features.HttpTimeout
import io.ktor.client.features.logging.LogLevel
import io.ktor.client.features.logging.Logger
import io.ktor.client.features.logging.Logging
import kotlinx.coroutines.runBlocking
import kotlinx.serialization.builtins.ListSerializer
import kotlinx.serialization.json.Json
import java.io.File

fun main() {
    val json = Json {
        ignoreUnknownKeys = true
    }
    val fetcher = Fetcher(
        json = json,
        httpClient = HttpClient(CIO) {
            install(HttpTimeout) {
                requestTimeoutMillis = 60_000
                connectTimeoutMillis = 60_000
            }
            install(Logging) {
                level = LogLevel.INFO
                logger = object : Logger {
                    override fun log(message: String) {
                        println(message)
                    }
                }
            }
        }
    )
    val libs = runBlocking { fetcher.fetch() }
    val output = File("output.json")
    val writerJson = Json(json) {
        prettyPrint = true
        prettyPrintIndent = " "
    }
    val text = writerJson.encodeToString(ListSerializer(LibraryInfo.serializer()), libs)
    output.writeText(text)
}
