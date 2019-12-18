/*    C201 - Back-end Programming
 *    Project 01_05_02

 *    Variables and functions
 *    
 *    Author: Mark J. Buckler
 *    Date:   July 3, 2017

 *    Filename: confirm.js
 */

"use strict";
var confirmWindow;

function processInput() {
    var propertyWidth = 300;
    var propertyHeight = 100;
    var winLeft = ((screen.width - propertyWidth) / 2);
    var winTop = ((screen.height - propertyHeight) / 2);
    var winOptions = "width=300,height=100";
    winOptions += ",left=" + winLeft;
    winOptions += ",top=" + winTop;
    confirmWindow = window.open("confirm.html", "confirm", winOptions);
    setTimeout("confirmWindow.close()", 5000);
}

function createEventListener() {
    var submitButton = document.getElementById("submit");
    if (submitButton.addEventListener) {
        submitButton.addEventListener("click", processInput, false);
    } 
    else if (submitButton.attachEvent) {
        submitButton.attachEvent("onclick", processInput);
    }
}

/* run createEventListener() function when page finishes loading */
if (window.addEventListener) {
    window.addEventListener("load", createEventListener, false);
} 
else if (window.attachEvent) {
    window.attachEvent("onload", createEventListener);
}