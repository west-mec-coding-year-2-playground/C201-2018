/*  Project 01_11_03

    Author: Mark J. Buckler
    Date:   July 23, 2017

    Filename: script.js
*/

"use strict";

/* global variables */
var httpRequest = false;
var entry = "msft";

function getRequestObject() {
    try {
        httpRequest = new XMLHttpRequest();
    } 
    catch (requestError) {
        return false;
    }
    return httpRequest;
}

function stopSubmission(evt) {
    if (evt.preventDefault) {
        evt.preventDefault();
    } 
    else {
        evt.returnValue = false;
    }
    getQuote();
}

function getQuote() {
    if (document.getElementsByTagName("input")[0].value) {
        entry = document.getElementsByTagName("input")[0].value;
    }
    else {
        document.getElementsByTagName("input")[0].value = entry;
    }
    if (!httpRequest) {
        httpRequest = getRequestObject();
    }
    httpRequest.abort();
    httpRequest.open("get", "StockCheck.php?t=" + entry, true);
    httpRequest.send(null);
    httpRequest.onreadystatechange = displayData;
    clearTimeout(updateQuote);
    var updateQuote = setTimeout('getQuote()', 10000);
}

function displayData() {
    if (httpRequest.readyState === 4 && httpRequest.status === 200) {
        console.log("httpRequest.status: " + httpRequest.status);
        var stockResults = httpRequest.responseText;
        console.log("stockResults: " + stockResults);
        var stockItems = JSON.parse(stockResults);
        console.log("stockItems: " + stockItems);
//        var stockItems = stockResults.split(/,|\"/);
//        for (var i = stockItems.length - 1; i >= 0; i--) {
//            if (stockItems[i] === "") {
//                stockItems.splice(i, 1);
//            }
//        }
        document.getElementById("ticker").innerHTML = stockItems.quote.symbol;
        document.getElementById("openingPrice").innerHTML = stockItems.quote.open;
        document.getElementById("lastTrade").innerHTML = stockItems[1];
        document.getElementById("lastTradeDT").innerHTML = stockItems[2] + ", " + stockItems[3];
        document.getElementById("change").innerHTML = stockItems[4];
        document.getElementById("range").innerHTML = (stockItems[8] * 1).toFixed(2) + " &ndash; " + (stockItems[7] * 1).toFixed(2);
        document.getElementById("volume").innerHTML = (stockItems[9] * 1).toLocaleString();
        
    }
}

function formatTable() {
    var rows = document.getElementsByTagName("tr");
    for (var i = 0; i < rows.length; i = i + 2) {
        rows[i].style.background = "#9FE098";
    }
}

var form = document.getElementsByTagName("form")[0];
if (form.addEventListener) {
    form.addEventListener("submit", stopSubmission, false);
    window.addEventListener("load", formatTable, false);
    window.addEventListener("load", getQuote, false);
} 
else if (form.attachEvent) {
    form.attachEvent("onsubmit", stopSubmission);
    window.attachEvent("onload", formatTable);
    window.attachEvent("onload", getQuote);
}
