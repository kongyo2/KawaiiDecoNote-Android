/**
 * expo prebuild が生成した android/app/build.gradle に、環境変数から読む
 * releaseサイニング設定を差し込む。リリースAPKワークフローがキーストアの
 * シークレットを持っている場合にだけ実行される。
 *
 * 期待する環境変数（Gradle実行時にも必要）:
 *   KAWAII_UPLOAD_STORE_FILE / KAWAII_UPLOAD_STORE_PASSWORD
 *   KAWAII_UPLOAD_KEY_ALIAS / KAWAII_UPLOAD_KEY_PASSWORD
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const gradlePath = join(process.cwd(), "android", "app", "build.gradle");
let gradle = readFileSync(gradlePath, "utf8");

const debugConfigAnchor = `        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }`;

if (!gradle.includes(debugConfigAnchor)) {
  console.error("build.gradle のsigningConfigsが想定と違う形。テンプレートが変わったかも。");
  process.exit(1);
}

const releaseConfig = `${debugConfigAnchor}
        release {
            storeFile file(System.getenv("KAWAII_UPLOAD_STORE_FILE"))
            storePassword System.getenv("KAWAII_UPLOAD_STORE_PASSWORD")
            keyAlias System.getenv("KAWAII_UPLOAD_KEY_ALIAS")
            keyPassword System.getenv("KAWAII_UPLOAD_KEY_PASSWORD")
        }`;

gradle = gradle.replace(debugConfigAnchor, releaseConfig);

// buildTypes.release の signingConfig を release に差し替える
const releaseTypeAnchor = `            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug`;
if (!gradle.includes(releaseTypeAnchor)) {
  console.error("build.gradle のbuildTypes.releaseが想定と違う形。テンプレートが変わったかも。");
  process.exit(1);
}
gradle = gradle.replace(
  releaseTypeAnchor,
  `            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.release`,
);

writeFileSync(gradlePath, gradle);
console.log("release署名設定をbuild.gradleへ差し込んだよ。");
