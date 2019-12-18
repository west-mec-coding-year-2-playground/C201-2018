/*  Project 01_11_03

    Author: Mark J. Buckler
    Date:   July 23, 2017

    Filename: script.js
*/

"use strict";

/* global variables */
var httpRequest = false;
var entry = "MSFT";

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
        var stockResults = httpRequest.responseText;
        var stockItems = JSON.parse(stockResults);
        document.getElementById("ticker").innerHTML = stockItems.symbol;
        document.getElementById("openingPrice").innerHTML = stockItems.open;
        document.getElementById("lastTrade").innerHTML = stockItems.latestPrice;
        var date = new Date(stockItems.latestUpdate);
        document.getElementById("lastTradeDT").innerHTML = date.toDateString() + "<br>" + date.toLocaleTimeString();
        document.getElementById("change").innerHTML = (stockItems.latestPrice - stockItems.open).toFixed(2);
        document.getElementById("range").innerHTML = "Low  " + (stockItems.low * 1).toFixed(2) + "<br>High " + (stockItems.high * 1).toFixed(2);
        document.getElementById("volume").innerHTML = (stockItems.latestVolume * 1).toLocaleString();
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
