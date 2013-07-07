var gameState = null;

function newGame (playerActorName) {
  gameState = new GameState(playerActorName);
};

function $makeWrappedListener (listener, notification) {
  return function WrappedEventListener () {
    notification();

    return listener.apply(this, arguments);
  };
};

registerOneShotEventListener = function (element, eventName, capture, listener) {
  var registered = true;
  var unregister, wrappedListener;

  unregister = function () {
    if (registered) {
      registered = false;
      element.removeEventListener(eventName, wrappedListener, capture);

      wrappedListener = null;
      element = null;
    }
  };

  wrappedListener = $makeWrappedListener(listener, unregister);
  listener = null;

  element.addEventListener(eventName, wrappedListener, capture);

  return {
    eventName: eventName,
    unregister: unregister
  }
};

function loadGlobalScript (uri, onComplete) {
  var anchor = document.createElement("a");
  anchor.href = uri;
  var absoluteUri = anchor.href;

  var done = false;

  var body = document.getElementsByTagName("body")[0];

  var scriptTag = document.createElement("script");

  registerOneShotEventListener(
    scriptTag, "load", true, 
    function ScriptTag_Load (e) {
      if (done)
        return;

      done = true;
      onComplete(scriptTag, null);
    }
  ); 
  registerOneShotEventListener(
    scriptTag, "error", true, 
    function ScriptTag_Error (e) {
      if (done)
        return;

      done = true;
      onComplete(null, e);
    }
  );

  scriptTag.type = "text/javascript";
  scriptTag.src = absoluteUri;

  try {
    body.appendChild(scriptTag);
  } catch (exc) {
    done = true;
    onComplete(null, exc);
  }
};

function playScript (scriptName) {
  var scriptUri = "data/" + scriptName + ".js";

  var script = allScripts[scriptName];

  function playTheScript () {
    var player = new ScriptPlayer(script, gameState);
    player.play();
  };

  if (!script) {
    loadGlobalScript(scriptUri, function (elt, error) {
      script = allScripts[scriptName];
      if (error || !script) {
        alert("Failed to load script '" + scriptName + "': " + error);
      } else {
        playTheScript();
      }
    });
  } else {
    playTheScript();
  }
};

function init () {
  $("#actor_rajar").click(function () {
    newGame("rajar");
    playScript("intro-rajar");
  });

  $("#actor_sofia").click(function () {
    newGame("sofia");
    playScript("intro-sofia");
  });
};

$().ready(init);