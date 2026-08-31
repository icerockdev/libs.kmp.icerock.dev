/*
 * Copyright 2021 IceRock MAG Inc. Use of this source code is governed by the Apache 2.0 license.
 */

package dev.icerock.kotlin.libraries.fetcher

data class MavenMetadata(
    val groupId: String,
    val artifactId: String,
    val versioning: Versioning
) {
    data class Versioning(
        val latest: String,
        val release: String,
        val lastUpdated: Long,
        val versions: List<String>
    )
}
