<?php

require __DIR__ . '/vendor/autoload.php';

$DB = new PDO('sqlite:db.db');
$auth = new \Delight\Auth\Auth($DB);

date_default_timezone_set('UTC');

session_start();

class Utils {

  /* https://stackoverflow.com/questions/13076867/computing-the-percentage-of-values-in-an-array */
  public static function averageArray($array, $round = 1) {
    $num = count($array);
    return array_map(function($val) use ($num, $round) {
      return array('count'=> $val, 'avg' => round( $val / $num * 100, $round));
    }, array_count_values($array));
  }

  /*
   * @description - Use the Google API's to reverse GEOCODE the LAT N' LONG for a city and country.
   * @return String */
  public static function getCityCountryFromLatLong($latitude, $longitude) {
    error_log("Utils::getCityCountryFromLatLong " . "\n", 3, __DIR__ . "/errors.txt");
    $url = "http://maps.googleapis.com/maps/api/geocode/json?latlng=" . $latitude . "," . $longitude . "&sensor=true";
    $data = file_get_contents($url);

    $jsondata = json_decode($data, true);

    // city
    foreach ($jsondata["results"] as $result) {
        foreach ($result["address_components"] as $address) {
            if (in_array("locality", $address["types"])) {
                $city = $address["long_name"];
            }
        }
    }

    // country
    foreach ($jsondata["results"] as $result) {
        foreach ($result["address_components"] as $address) {
            if (in_array("country", $address["types"])) {
                $country = $address["long_name"];
            }
        }
    }

    return $city . ", " . $country;

  }
}

class User {

  public static function getTimezone($userId) {

    global $DB;

    $sth = $DB->prepare("SELECT * FROM `user_timezones` WHERE `user_id` = :userId");
    $sth->bindParam(':userId', $userId);

    $sth->execute();

    $results = $sth->fetchAll();

    error_log("getTimezone " . "\n", 3, __DIR__ . "/errors.txt");
    error_log("results " . print_r($results, true) . "\n", 3, __DIR__ . "/errors.txt");

    return $results[ count($results) - 1]["timezone"];

  }

  public static function saveTimezone($userId, $timezoneOffsetMinutes) {
    global $DB;

    error_log("User.saveTimezone " . "\n", 3, __DIR__ . "/errors.txt");
    error_log("userId " . print_r($userId, true) . "\n", 3, __DIR__ . "/errors.txt");
    error_log("timezoneOffsetMinutes " . print_r($timezoneOffsetMinutes, true) . "\n", 3, __DIR__ . "/errors.txt");

    error_log("timezoneOffsetMinutes gettype " . gettype($timezoneOffsetMinutes) . "\n", 3, __DIR__ . "/errors.txt");


    // Convert minutes to seconds
    $timezoneName = timezone_name_from_abbr("", $timezoneOffsetMinutes * 60, false);

    error_log("timezoneName " . print_r($timezoneName, true) . "\n", 3, __DIR__ . "/errors.txt");

    // Not sure why this thing isn't updating?
    $sth = $DB->prepare("INSERT INTO user_timezones (user_id, timezone) VALUES (:userId, :timezone)");
    $sth->bindParam(":userId", $userId);
    $sth->bindParam(":timezone", $timezoneOffsetMinutes);
    $sth->execute();

  }

  public static function getUserId() {
    global $auth;

    if ($auth->isLoggedIn()) {
      return $auth->getUserId();
    } else {
      return null;
    }
  }

  public static function isLoggedIn() {
    global $auth;

    error_log("isLoggedIn?", 3, __DIR__ . "/errors.txt");
    error_log($auth->isLoggedIn() ? "LOGGED IN" : "LOGGED OUT", 3, __DIR__ . "/errors.txt");
    error_log(print_r($auth, true), 3, __DIR__ . "/errors.txt");
    return $auth->isLoggedIn();
  }

  public static function register($username, $password, $callback) {

    global $auth;

    $_SESSION["ERROR_FOR"] = "register";

    try {

      // Create a new user.
      $userId = $auth->register($username, $password, null, null);

      $_SESSION["ERROR_MESSAGE"] = NULL;

      if ($userId) {
        $callback($userId);
      }

      // we have signed up a new user with the ID `$userId`
    } catch (\Delight\Auth\InvalidEmailException $e) {

      error_log("Error registering " . print_r($e, true) . "\n", 3, __DIR__ . "/errors.txt");
      $_SESSION["ERROR_MESSAGE"] = "That email isn't valid. Double check and submit again.";

      error_log("What's the ERROR_MESSGE? " . print_r($_SESSION["ERROR_MESSAGE"], true) . "\n", 3, __DIR__ . "/errors.txt");

    } catch (\Delight\Auth\UserAlreadyExistsException $e) {

      // user already exists
      error_log("Error registering " . print_r($e, true) . "\n", 3, __DIR__ . "/errors.txt");
      $_SESSION["ERROR_MESSAGE"] = "This email already exists in the database. Try logging in.";

      error_log("What's the ERROR_MESSGE? " . print_r($_SESSION["ERROR_MESSAGE"], true) . "\n", 3, __DIR__ . "/errors.txt");
    }

  }

  public static function login($username, $password) {

    // echo "LOGGIGN IN";

    global $auth;

    $_SESSION["ERROR_FOR"] = "login";

    $rememberDuration = (int) (60 * 60 * 24); // One day

    try {

      $auth->login($username, $password, $rememberDuration);

      $_SESSION["ERROR_MESSAGE"] = NULL;

      // user is logged in
    } catch (\Delight\Auth\InvalidEmailException $e) {
        // wrong email address

        error_log("Error logging in " . print_r($e, true) . "\n", 3, __DIR__ . "/errors.txt");
        $_SESSION["ERROR_MESSAGE"] = "That email isn't in the database. Register, or double check and try again.";

        error_log("What's the ERROR_MESSGE? " . print_r($_SESSION["ERROR_MESSAGE"], true) . "\n", 3, __DIR__ . "/errors.txt");

    } catch (\Delight\Auth\InvalidPasswordException $e) {
        // wrong password

        error_log("Error logging in " . print_r($e, true) . "\n", 3, __DIR__ . "/errors.txt");
        $_SESSION["ERROR_MESSAGE"] = "The password isn't right. Double check and try again.";

        error_log("What's the ERROR_MESSGE? " . print_r($_SESSION["ERROR_MESSAGE"], true) . "\n", 3, __DIR__ . "/errors.txt");

    }
  }

  public static function logout() {

    error_log("User::logout" . "\n", 3, __DIR__ . "/errors.txt");

    global $auth;
    $auth->logout();
  }

}

class Entry {
  public static function track($userId, $emojion, $color, $day = NULL, $time = NULL) {

    error_log("Entry.track" . "\n", 3, __DIR__ . "/errors.txt");

    error_log("Emojion " . print_r($emojion,true) . "\n", 3, __DIR__ . "/errors.txt");

    error_log("color" . $color . "\n", 3, __DIR__ . "/errors.txt");

    global $DB;

    $sth = $DB->prepare("INSERT INTO entries (user_id, time, day, emojion_id, color) VALUES (:userId, :time, :day, :emojionId, :color)");

    if ($day === NULL) {
      $day = date('Y-m-d', time());
    }

    if ($time === NULL) {
      $time = time() * 1000; // Get it in milliseconds. Default is seconds.
    }

    // Time isn't saving correctly?
    // Need to figure out why...

    error_log("What's time() ? " . print_r(time(), true) . "\n", 3, __DIR__ . "/errors.txt");

    // Something going on with these two variables. The dates keep being set as the same???
    error_log("day " . print_r($day, true) . "\n", 3, __DIR__ . "/errors.txt");
    error_log("time " . print_r($time, true) . "\n", 3, __DIR__ . "/errors.txt");

    $sth->bindParam(':userId', $userId);
    $sth->bindParam(':time', $time);
    $sth->bindParam(':day', $day);
    $sth->bindParam(':emojionId', $emojion["key"]);
    $sth->bindParam(':color', $color);
    $sth->execute();

    $lastId = $DB->lastInsertId();

    error_log("lastId " . print_r($lastId, true) . "\n", 3, __DIR__ . "/errors.txt");

    return $lastId;

  }

  public static function getAllForDate($userId, $day) {
    global $DB;

    $sth = $DB->prepare("SELECT * FROM entries WHERE `user_id` = :userId AND `day` = :day");
    $sth->bindParam(':userId', $userId);
    $sth->bindParam(':day', $day);
    $sth->execute();

    $allUserEntries = $sth->fetchAll();

    $sth = $DB->query("SELECT * FROM all_emojions");
    $sth->execute();

    $allEmojions = $sth->fetchAll();

    error_log("allUserEntries (before): " . print_r($allUserEntries, true) . "\n", 3, __DIR__ . "/errors.txt");

    error_log("allEmojions: " . print_r($allEmojions, true) . "\n", 3, __DIR__ . "/errors.txt");

    $modifiedEntries = [];

    foreach ($allUserEntries as $userEntryKey => $userEntry) {
      foreach ($allEmojions as $emojion) {

        if ($userEntry["emojion_id"] === $emojion["key"]) {
          $userEntry["emoji"] = $emojion["emoji"];
          array_push($modifiedEntries, $userEntry);
          // error_log("userEntry" . print_r($userEntry, true) . "\n", 3, __DIR__ . "/errors.txt");
        }
      }
    }

    error_log("modifiedEntries" . print_r($modifiedEntries3, true) . "\n", 3, __DIR__ . "/errors.txt");

    return $modifiedEntries;
  }

  public static function getToday($userId) {
    $today = date('Y-m-d', time());
    return Entry::getAllForDate($userId, $today);
  }

  public static function saveNote($userId, $entryKey, $note) {

    global $DB;

    error_log("Entry.saveNote" . "\n", 3, __DIR__ . "/errors.txt");
    error_log("userId " . $userId . "\n", 3, __DIR__ . "/errors.txt");
    error_log("entryKey " . $entryKey . "\n", 3, __DIR__ . "/errors.txt");
    error_log("note " . $note . "\n", 3, __DIR__ . "/errors.txt");

    $sth = $DB->prepare("UPDATE `entries` SET `note` = :note WHERE `user_id` = :userId AND `key` = :entryKey");
    $sth->bindParam(':userId', $userId);
    $sth->bindParam(':entryKey', $entryKey);
    $sth->bindParam(':note', $note);
    $executedStatement = $sth->execute();

    error_log("executedStatement " . print_r($executedStatement, true) . "\n", 3, __DIR__ . "/errors.txt");

  }

  public static function saveLocation($userId, $entryKey, $latitude, $longitude) {

    global $DB;

    error_log("Entry.saveLocation " . "\n", 3, __DIR__ . "/errors.txt");
    error_log("userId " . $userId . "\n", 3, __DIR__ . "/errors.txt");
    error_log("entryKey " . $entryKey . "\n", 3, __DIR__ . "/errors.txt");
    error_log("latitude " . $latitude . "\n", 3, __DIR__ . "/errors.txt");
    error_log("longitude " . $longitude . "\n", 3, __DIR__ . "/errors.txt");

    error_log("latitude type " . gettype($latitude) . "\n", 3, __DIR__ . "/errors.txt");
    error_log("longitude type " . gettype($longitude) . "\n", 3, __DIR__ . "/errors.txt");

    $cityAndCountry = Utils::getCityCountryFromLatLong($latitude, $longitude);

    error_log("cityAndCountry " . print_r($cityAndCountry, true) . "\n", 3, __DIR__ . "/errors.txt");

    //WhyTF is this not working?
    $sth = $DB->prepare("UPDATE `entries` SET `latitude` = :latitude, `longitude` = :longitude, `location` = :location WHERE `user_id` = :userId AND `key` = :entryKey");
    $sth->bindParam(':userId', $userId);
    $sth->bindParam(':entryKey', $entryKey);
    $sth->bindParam(':latitude', $latitude);
    $sth->bindParam(':longitude', $longitude);
    $sth->bindParam(':location', $cityAndCountry);

    $executedStatement = $sth->execute();

    error_log("executedStatement " . print_r($executedStatement, true) . "\n", 3, __DIR__ . "/errors.txt");

  }

}

/* Gets the data for previous entries to render into a chart. */
class Charts {

  /*
   * @description - Returns all the data to renders charts from a start date to an end date.
   * @return Array */
  public static function getRange($userId, $endRange, $startRange) {
    global $DB;

    $startRangeFormatted = date('Y-m-d', $startRange);
    $endRangeFormatted = date('Y-m-d', $endRange);

    error_log("startRangeFormatted " . print_r($startRangeFormatted, true) . "\n", 3, __DIR__ . "/errors.txt");
    error_log("endRangeFormatted " . print_r($endRangeFormatted, true) . "\n", 3, __DIR__ . "/errors.txt");
    // Create an array of days between these two

    $startDateTime = new DateTime($startRangeFormatted);
    $endDateTime = new DateTime($endRangeFormatted);

    $period = new DatePeriod(
      $startDateTime,
      new DateInterval('P1D'),
      $endDateTime
    );

    error_log("What's the period? " . print_r($period, true) . "\n", 3, __DIR__ . "/errors.txt");
    error_log("What's the iterator as an array? " . print_r(iterator_to_array($period), true) . "\n", 3, __DIR__ . "/errors.txt");

    // Loop through those days
    error_log("About to loop through the period." . "\n", 3, __DIR__ . "/errors.txt");

    $stats = array();

    foreach ($period as $day) {

      $formattedDay = $day->format('Y-m-d');
      error_log("What's the formattedDay? " . print_r($formattedDay, true) . "\n", 3, __DIR__ . "/errors.txt");

      // Get all entries for those days and return the stats.

      $sth = $DB->prepare('SELECT * FROM `entries` WHERE `user_id` = :userId AND `day` = :day');
      $sth->bindParam(':userId', $userId);
      $sth->bindParam(':day', $formattedDay);
      $sth->execute();

      $entriesForDay = $sth->fetchAll();

      if ( !empty($entriesForDay)) {
        $stats[$formattedDay] = Charts::getStatsForDay($entriesForDay);
      }

    }

    // error_log("Charts.getRange " . "\n", 3, __DIR__ . "/errors.txt");
    // error_log("startRange " . print_r($startRange, true) . "\n", 3, __DIR__ . "/errors.txt");
    // error_log("endRange " . print_r($endRange, true) . "\n", 3, __DIR__ . "/errors.txt");


    return array_reverse($stats);

  }

  public static function getStatsForDay($entries) {

    global $DB;

    error_log("Charts.getStats" . "\n", 3, __DIR__ . "/errors.txt");

    error_log("entries " . print_r($entries, true) . "\n", 3, __DIR__ . "/errors.txt");

    $allEmojionIds = array();

    // I need to create a structure something like this.
    // array(
    //   "08-22-2017" => array(
    //     labels: ['🤔', '👆', '🌏'],
    //     series: [5, 3, 4]
    //   )

    // Loop through the entries.
    // Add the emoji_id to an Array

    foreach($entries as $entry) {
      array_push($allEmojionIds, $entry["emojion_id"]);
    }

    error_log("allEmojiIds " . print_r($allEmojionIds, true) . "\n", 3, __DIR__ . "/errors.txt");

    $averages = Utils::averageArray($allEmojionIds);

    error_log("averages " . print_r($averages, true) . "\n", 3, __DIR__ . "/errors.txt");

    $labels = array();
    $series = array();

    foreach ($averages as $emojionId => $average) {

      error_log("emojionId " . print_r($emojionId, true) . "\n", 3, __DIR__ . "/errors.txt");

      // Getting the emoji for the labels array.
      $sth = $DB->prepare("SELECT * FROM `all_emojions` WHERE `key` = :emojionId LIMIT 1");
      $sth->bindParam(":emojionId", $emojionId);
      $sth->execute();

      $emojion = $sth->fetchAll();

      error_log("emojion " . print_r($emojion, true) . "\n", 3, __DIR__ . "/errors.txt");

      array_push($labels, $emojion[0]["emoji"]);
      array_push($series, $average["avg"]);
    }

    $stats = array(
      "labels" => $labels,
      "series" => $series
    );

    error_log("stats " . print_r($stats, true) . "\n", 3, __DIR__ . "/errors.txt");

    return $stats;

  }
}

class Emojion {

  /*
   * @description - Sets the default Emojions for a particular userId.
   * @param $userId - The user's id in the datbase table.
   * @return void */
  static function setDefault($userId, $userEmojions = NULL) {

    global $DB;

    if ($userEmojions === NULL) {
      // Get the first 8 emoji from the all_emojions table
      $defaultEmojions = $DB->query("SELECT * FROM all_emojions LIMIT 8");

      $sth = $DB->prepare("INSERT INTO user_emojions (user_id, emojion_id) VALUES (:userId, :emojionId)");

      // set them into the user_emojions table as the user's emojions.
      foreach ($defaultEmojions as $emojion) {
        $sth->bindParam(':userId', $userId);
        $sth->bindParam(':emojionId', $emojion["key"] );
        $sth->execute();
      }

    } else {
      // Set the default from those given by the user.

      error_log("Setting emojions from what the user passed in " . "\n", 3, __DIR__ . "/errors.txt");

      error_log("userEmojions " . print_r($userEmojions, true) . "\n", 3, __DIR__ . "/errors.txt");

      $sth = $DB->prepare("INSERT INTO user_emojions (user_id, emojion_id) VALUES (:userId, :emojionId)");

      // set them into the user_emojions table as the user's emojions.
      foreach ($userEmojions as $userEmojion) {
        $sth->bindParam(':userId', $userId);
        $sth->bindParam(':emojionId', $userEmojion["key"]);
        $sth->execute();
      }


    }

  }

  public static function save($userId, $newEmojions) {

    global $DB;

    // Get the user's current emojions
    // Replace each of the keys with the new keys.

    $sth = $DB->prepare("SELECT * FROM user_emojions WHERE user_id = :userId");
    $sth->bindParam(':userId', $userId);
    $sth->execute();

    $userEmojions = $sth->fetchAll();


    // Save the keys into the database.

    // UPDATE `user_emojions` SET `emojion_id` = :emojionId WHERE `key` = :key

    $sth = $DB->prepare("UPDATE `user_emojions` SET `emojion_id` = :emojionId WHERE `key` = :key");

    // set them into the user_emojions table as the user's emojions.
    foreach ($userEmojions as $key => $userEmojion) {
      $sth->bindParam(':key', $userEmojion["key"]);
      $sth->bindParam(':emojionId', $newEmojions[$key]["key"]);
      $sth->execute();
    }

  }

  /*
   * @description - Get's the user's set emojions
   * @return array */
  public static function get($userId) {

    global $DB;

    // echo "EMOJION GET";
    //
    // echo "user_id " . $userId;

    $sth = $DB->prepare("SELECT * FROM user_emojions WHERE user_id = :userId");
    $sth->bindParam(':userId', $userId);
    $sth->execute();

    $emojions = $sth->fetchAll();

    // echo "emojion_ids";
    // var_dump($emojion_ids);

    $sth = $DB->prepare("SELECT * FROM all_emojions WHERE key = :emojionId");

    $user_emojions = array();

    // echo "Gonna loop through each of the emojion ids.";
    foreach ($emojions as $emojion) {
      $sth->bindParam(":emojionId", $emojion["emojion_id"]);
      $sth->execute();
      array_push($user_emojions, $sth->fetchAll()[0]);
    }

    return $user_emojions;

  }

  /*
   * @description - Returns an array of all the emotions that are not the user's.
  * @param $userId - The user's id.
  * @return Array. */
  public static function getNot($userId) {

    global $DB;

    // echo "EMOJION GET";
    //
    // echo "user_id " . $userId;

    $sth = $DB->prepare("SELECT * FROM user_emojions WHERE user_id = :userId");
    $sth->bindParam(':userId', $userId);
    $sth->execute();

    $emojions = $sth->fetchAll();

    // var_dump($emojions);

    // echo "emojion_ids";
    // var_dump($emojion_ids);

    $sth = $DB->prepare("SELECT * FROM all_emojions");
    $sth->execute();

    $all_emojions = $sth->fetchAll();

    // var_dump("all_emojions", $all_emojions);

    $not_user_emojions = array();

    // echo "Looping to determine the not user emojions";

    foreach($all_emojions as $all_emojion_key => $all_emojion ) {

      // echo "not_user_emojion_key " . $all_emojion_key;

      $is_in_users = false;

      if ($all_emojion_key <= 9) {
        foreach ($emojions as $emojion) {
          if ($all_emojion["key"] === $emojion["emojion_id"]) {
            $is_in_users = true;
          }
        }


        if ( ! $is_in_users) {

          // echo "Yep, not in users array.";
          array_push($not_user_emojions, $all_emojion);
        }

      } else {
        array_push($not_user_emojions, $all_emojion);
      }

    }

    // echo "not_user_emojions";
    // var_dump($not_user_emojions);

    //echo "What's not_user_emojions?";
    // var_dump($not_user_emojions);

    return $not_user_emojions;
  }

}

// function mylog($message) {
//   error_log($message, 3, __DIR__ . "/errors.txt");
// }

$AJAX = array(
  "saveEmojions" => function ($userId, $newEmojions) {
    // error_log("Calling AJAX.saveEmojions", 3, __DIR__ . "/errors.txt");
    // error_log(print_r($newEmojions, true), 3, __DIR__ . "/errors.txt");

    Emojion::save($userId, $newEmojions);
    $user_emojions = Emojion::get($userId, $newEmojions);

    // error_log(print_r($user_emojions, true), 3, __DIR__ . "/errors.txt");

    return json_encode($user_emojions);
  },

  "trackEntry" => function ($userId, $payload) {

    error_log("trackEntry " . "\n", 3, __DIR__ . "/errors.txt");
    error_log("payload " . print_r($payload, true) . "\n", 3, __DIR__ . "/errors.txt");

    $emojion = $payload["emojion"];
    $color = $payload["color"];

    error_log("emojion " . print_r($emojion, true) . "\n", 3, __DIR__ . "/errors.txt");
    error_log("color " . print_r($color, true) . "\n", 3, __DIR__ . "/errors.txt");

    Entry::track($userId, $emojion, $color);

    $allUserEntries = Entry::getToday($userId);

    error_log("allUserEntries (json encoded)" . print_r(json_encode($allUserEntries), true) . "\n", 3, __DIR__ . "/errors.txt");

    return json_encode($allUserEntries);
  },

  "saveNote" => function ($userId, $payload) {

    error_log("AJAX.saveNote " . "\n", 3, __DIR__ . "/errors.txt");

    $entry = $payload["entry"];
    $entryId = $entry["key"];
    $note = $payload["note"];

    error_log("entry " . print_r($entry, true) . "\n", 3, __DIR__ . "/errors.txt");
    error_log("note " . print_r($note, true) . "\n", 3, __DIR__ . "/errors.txt");

    Entry::saveNote($userId, $entryId, $note);

    $allUserEntries = Entry::getToday($userId);

    return json_encode($allUserEntries);
  },

  "saveLocationToEntry" => function ($userId, $payload) {
    $entryKey = $payload["entryKey"];
    $latitude = $payload["latitude"];
    $longitude = $payload["longitude"];

    Entry::saveLocation($userId, $entryKey, $latitude, $longitude);

    $allUserEntries = Entry::getToday($userId);

    return json_encode($allUserEntries);

  }

);

/* DATA that will initially passed to the client on load. */
$DATA = array(
  "isLoggedIn" => false
);

function getInitialData($userId) {

  global $DATA;

  // echo "Calling GET INITIAL DATA.";

  $today = strtotime("now");
  $sevenDaysAgo = strtotime("-1 week");

  error_log("getInitialData " . "\n", 3, __DIR__ . "/errors.txt");
  error_log("today " . print_r($today, true), 3, __DIR__ . "/errors.txt");
  error_log("sevenDaysAgo " . print_r($sevenDaysAgo, true), 3, __DIR__ . "/errors.txt");

  // Get the user's emojions
  $DATA["user_emojions"] = Emojion::get($userId);
  $DATA["not_user_emojions"] = Emojion::getNot($userId);
  $DATA["previousDayCharts"] = Charts::getRange($userId, $today, $sevenDaysAgo);
  $DATA["entries"] = Entry::getToday($userId);
  $DATA["timezoneOffset"] = User::getTimezone($userId);
  // The user is logged in now.
  $DATA["isLoggedIn"] = true;

  error_log("initialData " . print_r($DATA, true) . "\n", 3, __DIR__ . "/errors.txt");

}

//echo "Gonna check whether the request_method is set right or not.";

// error_log("Gonna check if the request method os post", 3, __DIR__ . "/errors.txt");

if ( $_SERVER['REQUEST_METHOD'] == 'POST' ) {

  //Make sure that the content type of the POST request has been set to application/json
  $contentType = isset($_SERVER["CONTENT_TYPE"]) ? trim($_SERVER["CONTENT_TYPE"]) : '';

  if ($contentType === "application/json") {

    // error_log("contentType " . $contentType, 3, __DIR__ . "/errors.txt");

    //Receive the RAW post data.
    $content = trim(file_get_contents("php://input"));

    // error_log("content " . $content, 3, __DIR__ . "/errors.txt");

    //Attempt to decode the incoming RAW post data from JSON.
    $decoded = json_decode($content, true);

    // error_log("Decoded json " . $decoded, 3, __DIR__ . "/errors.txt");

    //If json_decode succeeded , the JSON is valid.
    if(is_array($decoded)) {

      //Process the JSON.

      error_log("The json is alright. What's decoded?", 3, __DIR__ . "/errors.txt");

      error_log(print_r($decoded, true), 3, __DIR__ . "/errors.txt");

      error_log("ajaxMethod is not empty", 3, __DIR__ . "/errors.txt");
      error_log($decoded["ajaxMethod"] !== "", 3, __DIR__ . "/errors.txt");

      error_log("User is logged in ", 3, __DIR__ . "/errors.txt");
      error_log(User::isLoggedIn(), 3, __DIR__ . "/errors.txt");

      if ($decoded["ajaxMethod"] !== "") {
        if (User::isLoggedIn()) { // All methods related to saving data while logged in.
          $userId = User::getUserId();

          switch ($decoded["ajaxMethod"]) {
            case "saveEmojions":
              header('Content-Type: application/json');
              echo $AJAX["saveEmojions"]($userId, $decoded["payload"]);
              exit;
              break;
            case "trackEntry":
              header('Content-Type: application/json');
              $entries = $AJAX["trackEntry"]($userId, $decoded["payload"]);
              echo $entries;
              //error_log("About to return JSON. What's entries? " . print_r($entries, true), 3, __DIR__ . "/errors.txt");
              exit;
              break;
            case "saveNote":
              header('Content-Type: application/json');
              $entries = $AJAX["saveNote"]($userId, $decoded["payload"]);
              echo $entries;
              exit;
              break;
            case "saveLocationToEntry":
              header('Content-Type: application/json');
              $entries = $AJAX["saveLocationToEntry"]($userId, $decoded["payload"]);
              echo $entries;
              exit;
              break;
            case "logout":

              error_log("Calling logout from AJAX" . "\n", 3, __DIR__ . "/errors.txt");

              if (User::isLoggedIn()) {
                User::logout();
              }

              break;

          }

        } else { // Methods related to logging in or signing up and then saving local storage data.
          // Don't return JSON in this case. Just let it render the HTML.

          error_log("The user is logged out" . "\n", 3, __DIR__ . "/errors.txt");
          error_log("decoded " . print_r($decoded, true) . "\n", 3, __DIR__ . "/errors.txt");

          switch ($decoded["ajaxMethod"]) {
            case "signup":
              $payload = $decoded["payload"];
              $email = $payload["signUpEmail"];
              $password = $payload["signUpPassword"];

              error_log("Siging up" . "\n", 3, __DIR__ . "/errors.txt");
              error_log("payload " . print_r($payload, true) . "\n", 3, __DIR__ . "/errors.txt");
              error_log("email " . print_r($email, true) . "\n", 3, __DIR__ . "/errors.txt");
              error_log("password " . print_r($password, true) . "\n", 3, __DIR__ . "/errors.txt");


              User::register($email, $password, function ($userId) use ($email, $password, $payload) {
                // Log the user in immeditely.
                User::login($email, $password);

                // If the user has custom emojions in local storage set those

                if ( !empty($payload["userEmojions"]) ) {
                  error_log("has userEmojions in localStorage " . "\n", 3, __DIR__ . "/errors.txt");
                  Emojion::setDefault($userId, $payload["userEmojions"]);
                } else {
                  // Set the user's default Emojions
                  Emojion::setDefault($userId);
                }

                error_log("timezone " . print_r($payload["timezone"], true) . "\n", 3, __DIR__ . "/errors.txt");

                if ( !empty($payload["timezone"]) ) {
                  error_log("Saving the user time zone " . "\n", 3, __DIR__ . "/errors.txt");
                  User::saveTimezone($userId, $payload["timezone"]);
                }

                // If the user saved entries while not logged in go ahead and save those.
                if ( !empty($payload["entries"]) ) {
                  error_log("Has entries in local storage. " . "\n", 3, __DIR__ . "/errors.txt");
                  $days = $payload["entries"];

                  error_log("days " . print_r($days, true) . "\n", 3, __DIR__ . "/errors.txt");

                  foreach($days as $day => $entries) {
                    foreach ($entries as $entry) {

                      error_log("day " . print_r($day, true) . "\n", 3, __DIR__ . "/errors.txt");
                      error_log("entry " . print_r($entry, true) . "\n", 3, __DIR__ . "/errors.txt");

                      $emojion = array();
                      $emojion["key"] = $entry["key"];

                      error_log("emojion " . print_r($emojion, true) . "\n", 3, __DIR__ . "/errors.txt");


                      $color = $entry["color"];
                      $time = $entry["time"];

                      $entryId = Entry::track($userId, $emojion, $color, $day, $time);


                      error_log("entryId " . print_r($entryId, true) . "\n", 3, __DIR__ . "/errors.txt");

                      error_log("Does the key exist (note) in the entry array? " . array_key_exists("note", $entry) . "\n", 3, __DIR__ . "/errors.txt");

                      if ($entry["note"]) {

                        error_log("The entry has a note " . "\n", 3, __DIR__ . "/errors.txt");

                        Entry::saveNote($userId, $entryId, $entry["note"]);
                      }

                    }

                  }
                }

              });
              break;

            case "login":

              error_log("Logging the user in." . "\n", 3, __DIR__ . "/errors.txt");

              $payload = $decoded["payload"];
              $email = $payload["loginEmail"];
              $password = $payload["loginPassword"];

              User::login($email, $password);

              if ( !empty($payload["timezone"]) ) {
                error_log("Saving the user time zone " . "\n", 3, __DIR__ . "/errors.txt");
                User::saveTimezone(User::getUserId(), $payload["timezone"]);
              }

              // If the user saved entries while not logged in go ahead and save those.
              // TODO: Make this into a function.
              if ( !empty($payload["entries"]) ) {
                error_log("Has entries in local storage. " . "\n", 3, __DIR__ . "/errors.txt");
                $days = $payload["entries"];

                error_log("days " . print_r($days, true) . "\n", 3, __DIR__ . "/errors.txt");

                foreach($days as $day => $entries) {
                  foreach ($entries as $entry) {

                    error_log("day " . print_r($day, true) . "\n", 3, __DIR__ . "/errors.txt");
                    error_log("entry " . print_r($entry, true) . "\n", 3, __DIR__ . "/errors.txt");

                    $emojion = array();
                    $emojion["key"] = $entry["key"];

                    error_log("emojion " . print_r($emojion, true) . "\n", 3, __DIR__ . "/errors.txt");


                    $color = $entry["color"];
                    $time = $entry["time"];

                    $entryId = Entry::track($userId, $emojion, $color, $day, $time);


                    error_log("entryId " . print_r($entryId, true) . "\n", 3, __DIR__ . "/errors.txt");

                    error_log("Does the key exist (note) in the entry array? " . array_key_exists("note", $entry) . "\n", 3, __DIR__ . "/errors.txt");

                    if ($entry["note"]) {

                      error_log("The entry has a note " . "\n", 3, __DIR__ . "/errors.txt");

                      Entry::saveNote($userId, $entryId, $entry["note"]);
                    }

                  }

                }
              }

              break;
          }

        }
      }

    }

  }

}

$ERRORS = array();

if (User::isLoggedIn()) {

  $_SESSION["ERROR_MESSAGE"] = NULL;
  $_SESSION["ERROR_FOR"] = NULL;

  $userId = User::getUserId();
  getInitialData($userId);
} else {

  error_log("The user isn't logged in. (Checking at end)" . "\n", 3, __DIR__ . "/errors.txt");

  error_log("SESSION " . print_r($_SESSION, true). "\n", 3, __DIR__ . "/errors.txt");

  error_log("What's errors array? " . print_r($ERRORS, true) . "\n", 3, __DIR__ . "/errors.txt");

  if ( !empty($_SESSION) && $_SESSION["ERROR_MESSAGE"] != NULL) {
    $ERRORS["message"] = $_SESSION["ERROR_MESSAGE"];
    $ERRORS["for"] = $_SESSION["ERROR_FOR"];
  }

}

?>

<!doctype html>
<html class="no-js" lang="">
    <head>
      <meta charset="utf-8">
      <meta http-equiv="x-ua-compatible" content="ie=edge">
      <title>Emojional Life</title>
      <meta name="description" content="Track your emotions with emoji.">
      <meta name="viewport" content="user-scalable=no, width=device-width, initial-scale=1, maximum-scale=1">
      <link rel="apple-touch-icon" href="apple-touch-icon.png">
      <!-- Place favicon.ico in the root directory -->
      <link rel="stylesheet" href="assets/styles/styles.css">
      <link rel="stylesheet" href="assets/styles/vendor/chartist.css">

      <link rel="manifest" href="/manifest.json">

    </head>
    <body>

      <link rel="stylesheet" href="https://unpkg.com/flickity@2.0.9/dist/flickity.css">

      <div class="Loading js-loading Flex Flex--center Pstart(default) Pend(default)">
        <div>
          <div class="Loading-emoji">🤔</div>
          <div class="Ff(sansSerifBold) Fz(u2) Mtop(u5) Ta(c)">Loading the app, One second.</div>
        </div>

      </div>

      <div id="app" class="App FlexGrid js-app hidden">
        <div class="FlexGrid-cell FlexGrid-cell--fullMinusNav">

          <div class="App-container FlexGrid" v-bind:class="{ 'moveLeft': !shouldShowEmoji }">
            <div class="Screen FlexGrid-cell FlexGrid-cell--1of2 rsp-1-FlexGrid-cell--382">
              <div class="Emotions js-emotions FlexGrid rsp-1-P(f) rsp-1-W(382%) rsp-1-Br(default)">
                <emojion ref="emojions" v-for="(emojion, index) in emojions" v-bind:can-switch-emoji="canSwitchEmoji" v-bind:not-user-emojions="notUserEmojions" v-bind:colors="emojionBlockColors" v-bind:index="index" v-bind:emojion="emojion" v-on:turn-on-carousel="turnOnCarousel" v-on:turn-off-carousel="turnOffCarousel" v-on:track-entry="trackEntry"></emojion>
              </div>
              <tooltip v-if="tooltips.tap" emoji="👆" action="Tap" message="to track an emotion." reverse arrow-position="right" tooltip-type="tap"></tooltip>
              <tooltip v-if="tooltips.press && !tooltips.tap" emoji="👆" action="Press and hold" message="to change emotions." tooltip-type="press"></tooltip>
            </div>

            <div class="Screen Tracked FlexGrid-cell FlexGrid-cell--1of2 rsp-1-FlexGrid-cell--618">

              <div class="Pstart(default) Pend(default) Z(2) P(r) Bb(default) rsp-1-D(n)">
                <div class="FlexGrid FlexGrid--alignCenter W(100%)">

                 <div class="FlexGrid-cell FlexGrid FlexGrid--alignItemsCenter">
                   <div class="Fz(default) C(black) Ff(sansSerifBlack)">Emojional Life</div>
                 </div>

                 <div class="FlexGrid-cell" v-bind:class="[isLoggedIn ? 'FlexGrid FlexGrid--alignFlexEnd' : '' ]">
                   <!-- Login / Sign up Tab -->

                   <div v-if="!isLoggedIn" class="FlexGrid">
                     <div v-on:click="toggleLogin" class="FlexGrid-cell FlexGrid-cell--1of3">
                       <div v-bind:class="[shouldLogin ? 'Fw(bold) Td(u) Ff(sansSerifBold)' : 'Ff(sansSerifRegular)']" class="Fz(default) C(black) Ptop(default) Pbottom(default) Ta(c)">Login</div>
                     </div>
                     <div v-on:click="toggleSignUp" class="FlexGrid-cell FlexGrid-cell--1of3">
                       <div v-bind:class="[shouldSignUp ? 'Fw(bold) Td(u) Ff(sansSerifBold)' : ' Ff(sansSerifRegular)']" class="Fz(default) C(black) Ptop(default) Pbottom(default) Ta(c)">Sign Up</div>
                     </div>
                     <div class="FlexGrid-cell FlexGrid-cell--1of3 FlexGrid-cell--flex FlexGrid-cell--alignCenter">
                       <div class="Fz(default)">👤</div>
                     </div>
                   </div>

                   <div v-else class="FlexGrid">

                     <div v-on:click="logoutUser" class="FlexGrid-cell FlexGrid-cell--autoSize">
                       <div class="Fz(default) Td(u) C(black) Ptop(default) Pbottom(default) Ta(c) Ff(sansSerifRegular) C(darkerGrey)">Logout</div>
                     </div>
                     <div class="FlexGrid-cell FlexGrid-cell--autoSize FlexGrid FlexGrid--alignItemsCenter Mstart(d2)">
                       <span class="Fz(default)">👤</span>
                     </div>
                   </div>


                 </div>

                </div>
              </div>

              <div v-if="shouldSignUp" class="FlexGrid FlexGrid--alignCenter BackgroundColor BackgroundColor--white W(80%) Z(2) P(r)">

                <form class="W(100%) D(b)" action="/" method="POST" v-on:submit.prevent="signUpUser">

                  <div v-if="signUpLoginError" class="FlexGrid-cell FlexGrid-cell--full">
                    <p class="Error Fz(default) Ff(sansSerifRegular) C(red) Mtop(default) Mstart(default) Mend(default) Ptop(default) Pstart(default) Pend(default) Pbottom(default)">{{signUpLoginError}}</p>
                  </div>

                  <div class="FlexGrid-cell FlexGrid-cell--full">
                    <div class="Pstart(default) Pend(default) Ptop(default) Pbottom(u1)">
                      <input v-model="signUpEmail" class="Mtop(d2) Fz(default) W(100%) Br(4px) Pstart(default) Pend(default) Ptop(d2) Pbottom(d2) Br(4px) Border(default)" placeholder="Email" required type="email" name="signup_email">
                      <input v-model="signUpPassword" class="Mtop(d2) Fz(default) W(100%) Br(4px) Pstart(default) Pend(default) Ptop(d2) Pbottom(d2) Br(4px) Border(default)" placeholder="Password" required type="password" name="signup_password">
                      <input v-model="confirmPassword" class="Mtop(d2) Fz(default) W(100%) Br(4px) Pstart(default) Pend(default) Ptop(d2) Pbottom(d2) Br(4px) Border(default)" placeholder="Confirm Password" required type="password" name="signup_confirm_password">
                    </div>
                  </div>

                  <div class="FlexGrid-cell FlexGrid-cell--full">
                    <input class="Ptop(default) Pbottom(default) Bt(default) Bb(default) Ta(c) Fz(u1) C(black) Td(u) D(b) W(100%) BackgroundColor BackgroundColor--white Ff(sansSerifBold)" type="submit" value="Sign Up" name="signup_submit">
                  </div>
                </form>
              </div>

              <div v-if="shouldLogin" class="FlexGrid FlexGrid--alignCenter BackgroundColor BackgroundColor--white W(80%) Z(2) P(r)">

                <form class="W(100%) D(b)" action="/" method="POST" v-on:submit.prevent="loginUser">

                  <div v-if="signUpLoginError" class="FlexGrid-cell FlexGrid-cell--full">
                    <p class="Error Fz(default) Ff(sansSerifRegular) C(red) Mtop(default) Mstart(default) Mend(default) Ptop(default) Pstart(default) Pend(default) Pbottom(default)">{{signUpLoginError}}</p>
                  </div>

                  <div class="FlexGrid-cell FlexGrid-cell--full">
                    <div class="Pstart(default) Pend(default) Ptop(default) Pbottom(u1)">
                      <input v-model="loginEmail" class="Mtop(d2) Fz(default) W(100%) Br(4px) Pstart(default) Pend(default) Ptop(d2) Pbottom(d2) Border(default) Br(4px)" placeholder="Email" required type="email" name="login_email">
                      <input v-model="loginPassword" class="Mtop(d2) Fz(default) W(100%) Br(4px) Pstart(default) Pend(default) Ptop(d2) Pbottom(d2) Border(default) Br(4px)" placeholder="Password" required type="password" name="login_password">
                    </div>
                  </div>

                  <div class="FlexGrid-cell FlexGrid-cell--full">
                    <input class="Ptop(default) Pbottom(default) Bt(default) Bb(default) Ta(c) Fz(u1) C(black) Td(u) D(b) W(100%) BackgroundColor BackgroundColor--white Ff(sansSerifBold)" type="submit" value="Login" name="login_submit">
                  </div>
                </form>
              </div>

              <div v-if="hasEntries">

                <div class="Pstart(default) Pend(default) Ptop(u1) Pbottom(default)">
                  <p class="Ff(sansSerifBold) Fz(u3) Lh(11) C(black)">
                    {{ getPatternsMessage() }}
                  </p>
                </div>

              <div v-if="hasTodayEntries" class="Entries Pstart(default) Pend(default)">
                <!-- v-bind:total-entries="entriesToShow.length" -->
                <entry ref="entries" v-for="(entry, index) in entries" v-bind:total-entries="entries.length" v-bind:entry="entry" v-bind:index="index" v-on:save-note="saveNote" v-bind:show-tooltip="tooltips.write">
              </div>

              <div class="Notifications Pstart(default) Pend(default)">
                <notification v-if="!hasTodayEntries" emoji="👻" first>
                  No entries tracked yet today. <span class="Td(u)">Tap an emotion</span> to track one.
                </notification>
                <notification v-if="showLocationNotification" emoji="🌏" call-to-action-message="Add location" method="askUserForLocation">
                  Add location to each notification to see how where you're at effects how you feel.
                </notification>
              </div>

              <div v-bind:class="[previousDayCharts ? '' : 'PreviousDayEmotions--empty Mtop(u4)']" class="Pstart(default) Pend(default) PreviousDayEmotions Ptop(u4) Pbottom(u4) Bt(default)">

                <div v-if="!previousDayCharts" class="Loading Flex Flex--center Pstart(default) Pend(default)">
                  <div>
                    <div class="Loading-emoji Loading-emoji--noAnimation">👻</div>
                    <div class="Ff(sansSerifBold) Fz(u2) Mtop(u5) Ta(c)">Track at least a day of entries to start seeing stats on other days.</div>
                  </div>

                </div>

                <p class="Ff(sansSerifBold) Fz(u3) Lh(11) C(black)">
                  What about other days?
                </p>


                <div v-if="previousDayCharts" class="js-charts Ptop(d2)" style="display: flex; flex-wrap: nowrap; overflow-x: hidden;">
                  <day-emotion-chart v-for="(chart, day) in previousDayCharts" v-bind:day="day" v-bind:data="chart"></day-emotion-chart>
                </div>

                <div v-else class="js-charts Ptop(d2)" style="display: flex; flex-wrap: nowrap; overflow-x: hidden;">
                  <day-emotion-chart></day-emotion-chart>
                  <day-emotion-chart></day-emotion-chart>
                  <day-emotion-chart></day-emotion-chart>
                </div>
              </div>

              </div>
              <div v-else>

                <div class="Loading Flex Flex--center Pstart(default) Pend(default)">
                  <div>
                    <div class="Loading-emoji">👻</div>
                    <div class="Ff(sansSerifBold) Fz(u2) Mtop(u5) Ta(c)">No entries yet. Tap an emotion to track one.</div>
                  </div>

                </div>

              </div>

            </div>
          </div>

        </div>
        <!-- style="z-index: 5; position: fixed; width: 100%; bottom: 0;" -->
        <div class="Z(2) P(f) W(100%) B(0) rsp-1-T(0) rsp-1-Bb(default) BackgroundColor BackgroundColor--white O(hidden) FlexGrid-cell FlexGrid-cell--nav FlexGrid FlexGrid-cell--alignCenter"><!-- Navigation -->
          <div class="FlexGrid FlexGrid--full FlexGrid--fullHeight rsp-1-D(n)">

            <div v-on:click="toggleEmoji(true)" class="C(p) BackgroundColor BackgroundColor--white FlexGrid-cell FlexGrid-cell--flex FlexGrid-cell--alignCenter Br(default) Bt(default) Pos(r)">
              <div class="Pos(r) FlexGrid FlexGrid--guttersOneDown">
                <div class="FlexGrid-cell FlexGrid-cell--autoSize">
                  😄
                </div>
                <div class="FlexGrid-cell FlexGrid-cell--autoSize FlexGrid-cell--alignSelfCenter">
                  <div v-bind:class=" { 'Td(u) Fw(bold)': shouldShowEmoji }" class="Ff(default) C(black) Fz(default)">
                    Emotions
                  </div>
                </div>
              </div>
            </div>
            <div v-on:click="toggleEmoji(false)" class="C(p) BackgroundColor BackgroundColor--white FlexGrid-cell FlexGrid-cell--flex FlexGrid-cell--alignCenter Bt(default)">
              <div class="FlexGrid FlexGrid--guttersOneDown">
                <div class="FlexGrid-cell FlexGrid-cell--autoSize">
                  🕘
                </div>
                <div class="FlexGrid-cell FlexGrid-cell--autoSize FlexGrid-cell--alignSelfCenter">
                  <div v-bind:class=" { 'Td(u) Fw(bold)': !shouldShowEmoji }" class="Ff(default) C(black) Fz(default)">Patterns</div>
                </div>
              </div>
            </div>
          </div>

          <div class="FlexGrid FlexGrid--alignCenter W(100%) D(n) rsp-1-D(f)">

           <div class="FlexGrid-cell FlexGrid FlexGrid--alignItemsCenter FlexGrid-cell--halfScreen Br(default) rsp-1-FlexGrid-cell--382">
             <div class="Fz(default) C(black) Ff(sansSerifBlack) Pstart(default)">Emojional Life</div>
           </div>

           <div class="FlexGrid-cell">
             <!-- Login / Sign up Tab -->

             <div class="FlexGrid FlexGrid--alignCenter W(100%)">

              <div class="FlexGrid-cell FlexGrid FlexGrid--alignItemsCenter Pstart(default)">
                <div class="Fz(default) C(darkerGrey) Ff(sansSerifRegular)">Don't lose your data! 🔥</div>
              </div>

              <div class="FlexGrid-cell">
                <!-- Login / Sign up Tab -->

                <div v-if="!isLoggedIn" class="FlexGrid">
                  <div v-on:click="toggleLogin" class="FlexGrid-cell FlexGrid-cell--1of3">
                    <div v-bind:class="[shouldLogin ? 'Fw(bold) Td(u) Ff(sansSerifBold)' : 'Ff(sansSerifRegular)']" class="Fz(default) C(black) Ptop(default) Pbottom(default) Ta(c)">Login</div>
                  </div>
                  <div v-on:click="toggleSignUp" class="FlexGrid-cell FlexGrid-cell--1of3">
                    <div v-bind:class="[shouldSignUp ? 'Fw(bold) Td(u) Ff(sansSerifBold)' : ' Ff(sansSerifRegular)']" class="Fz(default) C(black) Ptop(default) Pbottom(default) Ta(c)">Sign Up</div>
                  </div>
                  <div class="FlexGrid-cell FlexGrid-cell--1of3 FlexGrid-cell--flex FlexGrid-cell--alignCenter">
                    <div class="Fz(default)">👤</div>
                  </div>
                </div>

                <div v-else class="FlexGrid FlexGrid--alignFlexEnd Pend(default)">

                  <div v-on:click="logoutUser" class="FlexGrid-cell FlexGrid-cell--autoSize">
                    <div class="Fz(default) Td(u) C(black) Ptop(default) Pbottom(default) Ta(c) Ff(sansSerifRegular) C(darkerGrey)">Logout</div>
                  </div>
                  <div class="FlexGrid-cell FlexGrid-cell--autoSize FlexGrid FlexGrid--alignItemsCenter Mstart(d2)">
                    <span class="Fz(default)">👤</span>
                  </div>
                </div>


              </div>

             </div>

           </div>

          </div>

        </div>
      </div>

      <script type="text/x-template" id="emojion_template">
        <div class="FlexGrid-cell FlexGrid-cell--1of2">
          <div class="Emotion BackgroundColor js-emotion" v-bind:style="{ backgroundColor: '#' + color }" v-bind:class="[canSwitchEmoji && isChangingEmoji ? 'Emotion--isSwitching js-emotion-switching' : '']">
            <emojion-carousel v-if="canSwitchEmoji && isChangingEmoji" v-bind:emojions="notUserEmojions" v-on:select-emoji-to-change-to="selectEmojionToChangeTo"></emojion-carousel>
            <div v-else class="Fz(10vh)">
              <div class="Ta(c)">{{emojion.emoji}}</div>
              <div v-bind:style="{ color: '#' + textColor }" class="Ff(serifItalic) Fz(u2) Ta(c)">{{emojion.emotion}}</div>
            </div>
          </div>
        </div>
      </script>

      <script type="text/x-template" id="emojion_carousel_template">
        <div class="EmotionCarousel">
          <div v-for="emojion in emojions" v-bind:style="{ backgroundColor: '#' + emojion.color }" class="W(100%) H(100%) Flex Flex--center Ta(c) Emotion-emoji Fz(10vh)">
            <div>
              <div class="Ta(c)">{{emojion.emoji}}</div>
              <div v-bind:style="{ color: '#' + emojion.text_color }" class="Ff(serifItalic) Fz(u2) Ta(c)">{{emojion.emotion}}</div>
            </div>
          </div>
        </div>
      </script>

      <script type="text/x-template" id="entry_template">
        <div class="EmotionNote BackgroundColor Pstart(default) Pend(default) Ptop(default) Pbottom(default)" v-bind:class="['BackgroundColor--' + entry.color, shouldResizeTextArea && canInputNote ? 'EmotionNote--active' : '']">

          <div class="FlexGrid FlexGrid--guttersOneDown FlexGrid--spaceBetween M">
            <div class="FlexGrid-cell FlexGrid-cell--9of10">
              <p class="Ff(default) Fz(u1) Lh(14) C(white)" style="font-size: 4vh;">
                {{entry.emoji}} at <span class="Fw(bold)">{{ formatTime(entry.time) }}</span> <span v-if="entry.location">at <span class="Fs(italic)">{{entry.location}}.</span></span>
              </p>
            </div>
            <div v-on:click="showNote" class="FlexGrid-cell FlexGrid-cell--1of10 FlexGrid-cell--alignSelfCenter">
              <span class="Fz(default)" v-if="entry.note">✍</span>
            </div>

          </div>

          <textarea v-if="canInputNote" v-on:input="resizeTextArea" rows="1" class="Mtop(d2) Ptop(d2) Pbottom(d2) Ff(default) Fz(default) W(100%) Br(4px) Pstart(default) Pend(default) Resize(none) js-note-input" placeholder="I feel this way because.."></textarea>
          <div class="Mtop(d2) Ff(sansSerifRegular) C(white) Fz(default) Lh(14)" v-if="!canInputNote && alreadyHasNote && isViewingNote">{{entry.note}}</div>
          <tooltip v-if="showTooltip && (index === totalEntries - 1) && !shouldResizeTextArea" emoji="✍" action="Write" message="a note." tooltip-type="write"></tooltip>
          <button v-if="shouldResizeTextArea && canInputNote" v-on:click="saveNote" class="D(b) W(100%)" style="min-height: 44px;">Save Note</button>
        </div>
      </script>

      <script type="text/template" id="tooltip_template">
        <div v-bind:class="[ reverse ? 'FlexGrid--reverse' : '', arrowPosition ? 'Tooltip--' + arrowPosition : '', tooltipType ? 'Tooltip--' + tooltipType : '']" class="FlexGrid FlexGrid--inline BackgroundColor BackgroundColor--smoky Tooltip">
          <div class="FlexGrid-cell FlexGrid FlexGrid-cell--autoSize FlexGrid--alignItemsCenter">
            <div class="P(default) Pos(r)">
              <p v-bind:class="['A(' + tooltipType + ')']" class="Ff(default) Fz(default) Lh(14) C(white) Pos(a) T(0) L(d2)">{{emoji}}</p>
            </div>
          </div>

          <div class="FlexGrid-cell">
            <div class="P(d2)">
              <p class="Ff(default) Fz(default) Lh(14) C(white)"><span class="Fw(bold)">{{action}}</span> {{message}}</p></div>
            </div>
          </div>
      </script>

      <script type="text/template" id="notification_template">
        <div v-if="shouldShow" v-bind:class="[first ? '' : 'Mtop(u4)']" class="Notification FlexGrid BackgroundColor Border(default) Br(4px) Bgc(grey)">
          <div class="FlexGrid-cell FlexGrid FlexGrid-cell--autoSize FlexGrid-cell--alignCenter">
              <div class="Pstart(default) Pend(default) Ptop(default) Pbottom(default)">
                <p class="Ff(default) Fz(u1) Lh(11)">
                  {{emoji}}
                </p>
              </div>
          </div>

          <div class="FlexGrid-cell">
            <div class="Pstart(default) Pend(default) Ptop(default) Pbottom(default)">
              <p class="Ff(sansSerifRegular) Fz(u1) Lh(11) C(darkerGrey)"><slot></slot></p>
            </div>

          </div>

          <div v-if="callToActionMessage && method" v-on="methods" class="FlexGrid-cell FlexGrid-cell--full Bt(default)">
            <button v-if="statusText" disabled class="W(100%) Bgc(grey) Pstart(default) Pend(default) Ptop(default) Pbottom(default) C(darkerGrey) Ff(sansSerif) Fz(default) Ta(c)">{{statusText}}</button>
            <button v-else class="W(100%) Bgc(grey) Pstart(default) Pend(default) Ptop(default) Pbottom(default) C(darkerGrey) Ff(sansSerifBold) Fz(default) Fw(bold) Td(u) Ta(c)">{{callToActionMessage}}</button>
          </div>

        </div>
      </script>

      <script src="https://unpkg.com/moment@2.18.1/min/moment.min.js"></script>
      <script src="https://unpkg.com/lodash@4.17.4"></script>
      <script src="https://unpkg.com/flickity@2.0.9/dist/flickity.pkgd.min.js"></script>
      <script src="https://unpkg.com/hammerjs@2.0.8/hammer.js"></script>
      <script src="assets/js/vendor/autosize.js"></script>
      <script src="assets/js/vendor/chartist.js"></script>
      <script src="https://unpkg.com/vue@2.4.2/dist/vue.js"></script>

      <script src="assets/js/consts-state.js"></script>

      <script src="assets/js/utils.js"></script>

      <?php if ($DATA["isLoggedIn"]): ?>
        <script>
          GLOBAL_STATE.isLoggedIn = true;

          UTILS.removeUserDataFromLocalStorage(); // Deleting already saved data from local storage.

          USER_DATA = <?php echo json_encode($DATA, JSON_PRETTY_PRINT); ?>
        </script>
      <?php else: ?>
        <script>
          GLOBAL_STATE.isLoggedIn = false;

          <?php if (!empty($ERRORS)): ?>
          ERROR_DATA = <?php echo json_encode($ERRORS, JSON_PRETTY_PRINT); ?>
          <?php endif; ?>

        </script>
      <?php endif; ?>

      <script src="assets/js/dom.js"></script>

      <script src="assets/js/ajax.js"></script> <!-- AJAX stuff -->
      <script src="assets/js/db.js"></script>

      <script src="assets/js/components/emojion.js"></script>
      <script src="assets/js/components/emojion-carousel.js"></script>
      <script src="assets/js/components/entry.js"></script>
      <script src="assets/js/components/tooltip.js"></script>
      <script src="assets/js/components/notification.js"></script>
      <script src="assets/js/components/day-emotion-chart.js"></script>
      <script src="assets/js/components/day-emotion-chart-carousel.js"></script>

      <script src="assets/js/app.js"></script>

      <!-- <script src="assets/js/init.js"></script> -->

    </body>

</html>
