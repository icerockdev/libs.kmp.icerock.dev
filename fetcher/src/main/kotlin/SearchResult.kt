/*
 * Copyright 2021 IceRock MAG Inc. Use of this source code is governed by the Apache 2.0 license.
 */

package dev.icerock.kotlin.libraries.fetcher

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class SearchResult(
    val response: Response
) {
    @Serializable
    data class Response(
        val numFound: Int,
        val start: Int,
        val docs: List<Doc>
    )

    @Serializable
    data class Doc(
        val id: String,
        @SerialName("g")
        val group: String,
        @SerialName("a")
        val artifact: String,
        @SerialName("v")
        val version: String,
        @SerialName("p")
        val packaging: String,
        val timestamp: Long,
        @SerialName("ec")
        val classificators: List<String>,
        val tags: List<String>? = null
    )
}
