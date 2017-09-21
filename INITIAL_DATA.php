<?php if ($DATA["isLoggedIn"]): ?>
  <script>
    GLOBAL_STATE.isLoggedIn = true;

    document.addEventListener('DOMContentLoaded', function () {
      UTILS.removeUserDataFromLocalStorage(); // Deleting already saved data from local storage.
    });

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
