plugins {
    val kotlinVersion = "1.5.10"

    kotlin("jvm") version kotlinVersion
    kotlin("plugin.serialization") version kotlinVersion
}

dependencies {
    implementation(libs.bundles.ktor.client)
    implementation(libs.konsume.xml)
    implementation(libs.kotlinx.serialization)

    testImplementation(libs.kotlin.test.junit)
    testImplementation(libs.ktor.client.mock)
}
