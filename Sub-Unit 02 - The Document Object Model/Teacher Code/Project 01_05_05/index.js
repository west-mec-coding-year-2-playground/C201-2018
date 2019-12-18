/*    C201 - Back-end Programming
 *    Project 01_05_05

 *    Variables and functions
 *    
 *    Author: Mark J. Buckler
 *    Date:   July 3, 2017

 *    Filename: index.js
 */

/* global variables */
"use strict";

function createTOC() {
    var list = document.getElementsByTagName("ul")[0];
    var headingText;
    var TOCEntry;
    for (var i = 1; i <= 10; i++) {
        headingText = document.getElementById(i).innerHTML;
        TOCEntry = document.createElement("li");
        TOCEntry.innerHTML = "<a href=#" + i + ">" + headingText + "</a>";
        list.appendChild(TOCEntry);
    }
}

/* run createTOC() function when page finishes loading */
if (window.addEventListener) {
    window.addEventListener("load", createTOC, false);
} 
else if (window.attachEvent) {
    window.attachEvent("onload", createTOC);
}