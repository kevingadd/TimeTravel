NextPanelDelay = 0;
NextScriptDelay = 50;

function ScriptPlayer (script, gameState) {
  this.script = script;
  this.gameState = gameState;

  this.page = $("#page_template").clone();
  this.page.attr("id", null);
  this.page.appendTo($(".viewport"));

  this.reset();
};

ScriptPlayer.prototype.reset = function () {
  this.currentPanelIndex = -1;
  this.displayedPanelCount = 0;
  this.previousPanel = null;
};

ScriptPlayer.prototype.play = function () {
  var previousHeight = (this.page.get()[0]).offsetHeight;

  this.page.css("min-height", previousHeight + "px");
  this.page.html("");

  this.reset();

  window.setTimeout(this.nextPanel.bind(this), NextPanelDelay);
};

ScriptPlayer.prototype.playNextScript = function () {
  // FIXME: Do something if there is no next script
  if (this.script.nextScript)
    playScript(this.script.nextScript);
  else if (this.script.hasMagicBranchingOutro)
    playScript("outro-" + this.gameState.playerActorName);
  else
    $("#buttons").fadeIn(150);
};

ScriptPlayer.prototype.ended = function () {
  this.page.css("min-height", "");

  window.setTimeout(this.playNextScript.bind(this), NextScriptDelay);
};

ScriptPlayer.prototype.nextPanel = function () {
  this.currentPanelIndex += 1;

  var panel = this.script.panels[this.currentPanelIndex];
  if (!panel) {
    this.ended();
    return;
  }

  if (!panel.$checkPrerequisites(this.gameState)) {
    this.nextPanel();
    return;
  }

  if (panel.isReset)
    this.previousPanel = null;

  // Clear any flags previously set by this panel.
  this.gameState.clearFlagSet(panel.name);

  // FIXME: Inherit some state from previous panel - background, etc.
  var displayPanel = 
    (this.previousPanel || $("#panel_template")).clone();
  displayPanel.attr("id", null);
  displayPanel.children(".bubbles").html("");

  var bubbleCount = 0;

  displayPanel.getActor = function (actorName) {
    var existingActor = displayPanel.children(".actors").children(".actor_" + actorName);
    if (existingActor.length < 1) {
      existingActor = $("#actor_template").clone();
      existingActor.attr("id", null);
      existingActor.addClass("actor_" + actorName);
      existingActor.appendTo(displayPanel.children(".actors"));
    }

    return existingActor;
  };

  displayPanel.addSpeechBubble = function (speakerName) {
    bubbleCount += 1;

    var bubble = $("#speechbubble_template").clone();
    bubble.attr("id", null);
    bubble.addClass(speakerName);
    bubble.addClass(bubbleCount == 1 ? "call" : "response");
    bubble.appendTo(displayPanel.children(".bubbles"));

    bubble.addChoice = function (text) {
      var choice = $("#choice_template").clone();
      choice.attr("id", null);
      choice.text(text);
      choice.appendTo(this.children(".choices"));
      return choice;
    };

    bubble.children(".text").text("...");

    return bubble;
  };

  displayPanel.setActorMood = function (actorName, mood) {
    var imageUri = actorName + "_" + mood;
    if (imageUri.indexOf(".") < 0)
      imageUri += ".png";

    this.getActor(actorName + "_mood")
      .attr("src", "actors/" + imageUri);
  };

  for (var c = panel.preCommands, l = c.length, i = 0; i < l; i++) {
    c[i].call(panel, displayPanel, this);
  }

  for (var c = panel.commands, l = c.length, i = 0; i < l; i++) {
    c[i].call(panel, displayPanel, this);
  }

  // If no bubbles appeared (because there are no valid choices
  //  in this panel due to flags/prerequisites) then abort this scene.
  if ((bubbleCount === 0) && (!panel.hasSize)) {
    console.log("Panel '" + panel.name + "' has no content");
    this.nextPanel();
    return;
  }

  if (
    this.displayedPanelCount && 
    ((this.displayedPanelCount % 2) == 0)
  )
    $(document.createElement("br")).appendTo(this.page); 

  this.displayedPanelCount += 1;
  displayPanel.appendTo(this.page);

  this.previousPanel = displayPanel;

  window.setTimeout(this.nextPanel.bind(this), NextPanelDelay);
};