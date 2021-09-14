# Summary
List of Kotlin Multiplatform libraries - https://libs.kmp.icerock.dev/. 

All info about libraries automatically fetch from maven everyday by GitHub Scheduled Action.

# How to add own lib
Add in `libraries.json` new object in array:
```json
[
  ...,
  {
    "github": "org/name",
    "category": "category name",
    "maven": "url to your metadata artifact on maven repo"
  }
]
```

# Fetch info algorithm about library
1. Look up to `maven-metadata.xml` file to set `groupId`, `artifactId` and library `version`
2. Open the `version` directory and look to `${artifactId}.module` file
3. The `dependencies` block contains `module:kotlin-stdlib-common`. There is the Kotlin version located
4. If there is a url link to `.module` file, follow it and do 2 and 3 steps again

## License
        
    Copyright 2020 IceRock MAG Inc.
    
    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at
    
       http://www.apache.org/licenses/LICENSE-2.0
    
    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
