<?php

if (file_exists("../stage/scripts.json")) {

  $packageJSONFile = fopen("../stage/scripts.json", "r") or die("Unable to open ../stage/scripts.json");
  $packageJSONFileContents = fread($packageJSONFile, filesize("../stage/scripts.json"));
  fclose($packageJSONFile);

  // error_log("packageJSONFileContents " . print_r($packageJSONFileContents, true) . "\n", 3, __DIR__ . "/compile.txt");

  $parsed = json_decode($packageJSONFileContents);

  // error_log("parsed " . print_r($parsed, true) . "\n", 3, __DIR__ . "/compile.txt");

  $scriptsToRun = $parsed->scripts;

  // error_log("scriptsToRun " . print_r($scriptsToRun, true) . "\n", 3, __DIR__ . "/compile.txt");

  foreach($scriptsToRun as $script) {
    shell_exec($script);
  }

} else {
  die("../stage/scripts.json doesn't exist.");
}

?>
