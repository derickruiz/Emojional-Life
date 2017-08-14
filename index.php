<?php

$notLoggedIn = true;

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

      <div class="Loading BackgroundColor BackgroundColor--smoky js-loading">
        <div class="Loading-emoji">🤔</div>
        <div>Loading...</div>
      </div>

      <div id="app" class="App FlexGrid js-app hidden">
        <div class="FlexGrid-cell FlexGrid-cell--fullMinusNav">

          <div class="App-container FlexGrid" v-bind:class="{ 'moveLeft': !shouldShowEmoji }">
            <div class="Screen FlexGrid-cell FlexGrid-cell--1of2">
              <div class="Emotions js-emotions">
                <emojion ref="emojions" v-for="(emojion, index) in emojions" v-bind:can-switch-emoji="canSwitchEmoji" v-bind:not-user-emojions="notUserEmojions" v-bind:colors="emojionBlockColors" v-bind:index="index" v-bind:emojion="emojion" v-on:turn-on-carousel="turnOnCarousel" v-on:turn-off-carousel="turnOffCarousel" v-on:track-entry="trackEntry"></emojion>
              </div>
              <tooltip v-if="tooltips.tap" emoji="👆" action="Tap" message="to track an emotion." reverse arrow-position="right" tooltip-type="tap"></tooltip>
              <tooltip v-if="tooltips.press && !tooltips.tap" emoji="👆" action="Press and hold" message="to change emotions." tooltip-type="press"></tooltip>
            </div>

            <div class="Screen Tracked FlexGrid-cell FlexGrid-cell--1of2 BackgroundColor BackgroundColor--white">

              <div class="Mtop(default) Mstart(default) Mend(default)">
              <div class="FlexGrid FlexGrid--alignCenter Bgc(grey) W(100%)">

               <div class="FlexGrid-cell FlexGrid FlexGrid--alignItemsCenter">
                 <div class="Fz(default) C(darkerGrey) Ff(sansSerifRegular) Pstart(default)">Don't lose your data! 🔥</div>
               </div>

               <div class="FlexGrid-cell">
                 <!-- Login / Sign up Tab -->

                 <div class="FlexGrid">
                   <div class="FlexGrid-cell FlexGrid-cell--1of2 Bstart(default) Br(default)">
                     <div class="Fz(default) Ff(sansSerifRegular) C(darkerGrey) Ptop(default) Pbottom(default) Ta(c)">Login</div>
                   </div>
                   <div class="FlexGrid-cell FlexGrid-cell--1of2">
                     <div class="Fz(default) Ff(sansSerifBold) C(darkerGrey) Ptop(default) Pbottom(default) Ta(c) Fw(bold) Td(u)">Sign Up</div>
                   </div>
                 </div>

               </div>

              </div>

              <div class="FlexGrid FlexGrid--alignCenter Bgc(grey) W(80%)">
                <div class="FlexGrid-cell FlexGrid-cell--full Bt(default)">
                  <div class="Pstart(default) Pend(default) Ptop(default) Pbottom(u1)">
                    <input class="Mtop(d2) Fz(default) W(100%) Br(4px) Pstart(default) Pend(default) Ptop(d2) Pbottom(d2)" placeholder="Email" type="text">
                    <input class="Mtop(d2) Fz(default) W(100%) Br(4px) Pstart(default) Pend(default) Ptop(d2) Pbottom(d2)" placeholder="Password" type="password">
                    <input class="Mtop(d2) Fz(default) W(100%) Br(4px) Pstart(default) Pend(default) Ptop(d2) Pbottom(d2)" placeholder="Confirm Password" type="password">
                  </div>
                </div>

                <div class="FlexGrid-cell FlexGrid-cell--full">
                  <button class="Ptop(default) Pbottom(default) Bt(default) Ta(c) Fz(u1) C(darkerGrey) D(b) W(100%) Bgc(grey) Ff(sansSerifBold)">Sign Up</button>
                </div>
              </div>

              </div>

              <div v-if="hasEntries">

                <div class="Pstart(default) Pend(default) Ptop(u1) Pbottom(default)">
                  <p class="Ff(sansSerifBold) Fz(u3) Lh(11) C(black)">
                    {{ getPatternsMessage() }}
                  </p>
                </div>

                <!--
                <div v-on:click="toggleEntriesForDay" class="Ff(default) Pstart(default) Pend(default) Pbottom(default) Ta(l) Td(u) Ta(l) C(chaliceSilver) Fz(default)">
                  See my entire day.
                </div> -->

              <div class="Entries">
                <!-- v-bind:total-entries="entriesToShow.length" -->
                <entry ref="entries" v-for="(entry, index) in entries" v-bind:total-entries="entries.length" v-bind:entry="entry" v-bind:index="index" v-on:save-note="saveNote" v-bind:show-tooltip="tooltips.write">
              </div>

              <div v-if="showLocationNotification" class="Notifications Ptop(u4) Pstart(default) Pend(default)">
                <notification emoji="🌏" message="Add location to each notification to see how where you're at effects how you feel." call-to-action-message="Add location" method="askUserForLocation"></notification>
              </div>

              <div class="Pstart(default) Pend(default) PreviousDayEmotions PreviousDayEmotions--empty Ptop(u4) Pbottom(u4) Mtop(u4)">

                <div class="Loading Flex Flex--center Pstart(default) Pend(default)">
                  <div>
                    <div class="Loading-emoji Loading-emoji--noAnimation">👻</div>
                    <div class="Ff(sansSerifBold) Fz(u2) Mtop(u5) Ta(c)">Track at least a day of entries to start seeing stats on other days.</div>
                  </div>

                </div>

                <p class="Ff(sansSerifBold) Fz(u3) Lh(11) C(black)">
                  What about other days?
                </p>

                <div class="js-charts Ptop(d2)" style="display: flex; flex-wrap: nowrap; overflow-x: hidden;">
                  <day-emotion-chart></day-emotion-chart>
                  <day-emotion-chart></day-emotion-chart>
                  <day-emotion-chart></day-emotion-chart>
                </div>
              </div>

              <div class="Patterns Patterns--empty Ptop(u4) Pbottom(u4)">

                <div class="Loading Flex Flex--center Pstart(default) Pend(default)">
                  <div>
                    <div class="Loading-emoji Loading-emoji--noAnimation">💸</div>
                    <div class="Ff(serifItalic) Fz(u2) Mtop(u5) Ta(c)"><span class="Td(u)">Upgrade</span> to get more insights into your emotional patterns.</div>
                  </div>

                </div>

                <div class="Pstart(default) Pend(default)">
                  <p class="Ff(sansSerifBold) Fz(u3) Lh(11) C(black)">
                    What patterns do I see?
                  </p>
                </div>

                <div class="Pstart(default) Pend(default)Pbottom(default)">
                  <p class="Ff(serifRegular) Fz(default) Lh(14) C(black) Mbottom(d3) Mtop(d2)">When I’m in <span class="Ff(serifBold)">Chiang Mai</span>, I tend to feel 😄 <span class="Ff(serifItalic)">Happy</span>, 😌 <span class="Ff(serifItalic)">Grateful</span>, and 😎 <span class="Ff(serifItalic)">Cool.</span></p>
                  <p class="Ff(serifRegular) Fz(default) Lh(14) C(black) Mbottom(d3) Mtop(d3)">When it’s <span class="Ff(serifBold)">raining</span> I write <span class="Ff(serifItalic)">more</span> than usual.</p>
                  <p class="Ff(serifRegular) Fz(default) Lh(14) C(black) Mbottom(d3) Mtop(d3)">I feel positive emotions <span class="Ff(serifBold)">74%</span> of the time.</p>
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
        <div style="z-index: 5; position: fixed; width: 100%; bottom: 0;" class="FlexGrid-cell FlexGrid-cell--nav FlexGrid FlexGrid-cell--alignCenter"><!-- Navigation -->
          <div class="FlexGrid FlexGrid--full FlexGrid--fullHeight">

            <div v-on:click="toggleEmoji(true)" class="C(p) BackgroundColor BackgroundColor--smoky FlexGrid-cell FlexGrid-cell--flex FlexGrid-cell--alignCenter Br(default) Bt(default) Pos(r)">
              <div class="Pos(r) FlexGrid FlexGrid--guttersOneDown">
                <div class="FlexGrid-cell FlexGrid-cell--autoSize">
                  😄
                </div>
                <div class="FlexGrid-cell FlexGrid-cell--autoSize FlexGrid-cell--alignSelfCenter">
                  <div v-bind:class=" { 'Td(u) Fw(bold)': shouldShowEmoji }" class="Ff(default) C(white) Fz(default)">
                    Emotions
                  </div>
                </div>
              </div>
            </div>
            <div v-on:click="toggleEmoji(false)" class="C(p) BackgroundColor BackgroundColor--smoky FlexGrid-cell FlexGrid-cell--flex FlexGrid-cell--alignCenter Bt(default)">
              <div class="FlexGrid FlexGrid--guttersOneDown">
                <div class="FlexGrid-cell FlexGrid-cell--autoSize">
                  🕘
                </div>
                <div class="FlexGrid-cell FlexGrid-cell--autoSize FlexGrid-cell--alignSelfCenter">
                  <div v-bind:class=" { 'Td(u) Fw(bold)': !shouldShowEmoji }" class="Ff(default) C(white) Fz(default)">Patterns</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <script type="text/x-template" id="emojion_template">
        <div class="Emotion BackgroundColor js-emotion" v-bind:class="['BackgroundColor--' + colors[index], canSwitchEmoji && isChangingEmoji ? 'Emotion--isSwitching js-emotion-switching' : '']">
          <emojion-carousel v-if="canSwitchEmoji && isChangingEmoji" v-bind:emojions="notUserEmojions" v-bind:color="colors[index]" v-on:select-emoji-to-change-to="selectEmojionToChangeTo"></emojion-carousel>
          <div v-else class="Fz(10vh)">
            <div class="Ta(c)">{{emojion.emoji}}</div>
            <div v-bind:class="[colors[index] === 'black' ? 'C(white)' : 'C(black)']" class="Ff(serifItalic) Fz(u2) Ta(c)">{{emojion.emotion}}</div>
          </div>

        </div>
      </script>

      <script type="text/x-template" id="emojion_carousel_template">
        <div class="EmotionCarousel">
          <div v-for="emojion in emojions" class="W(100%) H(100%) Flex Flex--center Ta(c) Emotion-emoji Fz(10vh)">
            <div>
              <div class="Ta(c)">{{emojion.emoji}}</div>
              <div v-bind:class="[color === 'black' ? 'C(white)' : 'C(black)']" class="Ff(serifItalic) Fz(u2) Ta(c)">{{emojion.emotion}}</div>
            </div>
          </div>
        </div>
      </script>

      <script type="text/x-template" id="entry_template">
        <div class="EmotionNote BackgroundColor Pstart(default) Pend(default) Ptop(default) Pbottom(default)" v-bind:class="['BackgroundColor--' + entry.color, shouldResizeTextArea && canInputNote ? 'EmotionNote--active' : '']">

          <div class="FlexGrid FlexGrid--guttersOneDown FlexGrid--spaceBetween M">
            <div class="FlexGrid-cell FlexGrid-cell--9of10">
              <p class="Ff(default) Fz(u1) Lh(14) C(white)" style="font-size: 4vh;">
                {{entry.emoji}} at <span class="Fw(bold)">{{ formatTime(entry.time) }}</span> <span v-if="entry.ll">at <span class="Fs(italic)">{{entry.location}}.</span></span>
              </p>
            </div>
            <div v-on:click="showNote" class="FlexGrid-cell FlexGrid-cell--1of10 FlexGrid-cell--alignSelfCenter">
              <span class="Fz(default)" v-if="entry.note">✍</span>
            </div>

          </div>

          <textarea v-if="canInputNote" v-on:input="resizeTextArea" rows="1" class="Mtop(d2) Ptop(d2) Pbottom(d2) Ff(default) Fz(default) W(100%) Br(4px) Pstart(default) Pend(default) Resize(none) js-note-input" placeholder="I feel this way because.."></textarea>
          <div class="Mtop(d2) Ff(default) C(white) Fz(default) Lh(14)" v-if="!canInputNote && alreadyHasNote && isViewingNote">{{entry.note}}</div>
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
        <div v-if="shouldShow" class="Notification FlexGrid BackgroundColor Border(default) Br(4px) Bgc(grey)">
          <div class="FlexGrid-cell FlexGrid FlexGrid-cell--autoSize FlexGrid-cell--alignCenter">
              <div class="Pstart(default) Pend(default) Ptop(default) Pbottom(default)">
                <p class="Ff(default) Fz(u1) Lh(11)">
                  {{emoji}}
                </p>
              </div>
          </div>

          <div class="FlexGrid-cell">
            <div class="Pstart(default) Pend(default) Ptop(default) Pbottom(default)">
              <p class="Ff(sansSerifRegular) Fz(u1) Lh(11) C(darkerGrey)">{{message}}</p>
            </div>

          </div>

          <div v-if="callToActionMessage && method" v-on="methods" class="FlexGrid-cell FlexGrid-cell--full Bt(default)">
            <button class="W(100%) Bgc(grey) Pstart(default) Pend(default) Ptop(default) Pbottom(default) C(darkerGrey) Ff(sansSerifBold) Fz(default) Fw(bold) Td(u) Ta(c)">{{callToActionMessage}}</button>
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

      <?php if ($notLoggedIn): ?>
        <script>
          GLOBAL_STATE.notLoggedIn = true;
        </script>
      <?php else: ?>
        <script>
          GLOBAL_STATE.notLoggedIn = false;
        </script>
      <?php endif; ?>

      <script src="assets/js/utils.js"></script>
      <script src="assets/js/dom.js"></script>

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
