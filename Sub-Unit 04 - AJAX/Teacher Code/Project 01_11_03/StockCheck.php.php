<?php
$TickerSymbol = $_GET["t"];
header("Cache-Control: no-cache");
header("Content-Type: text/csv");
//$Quote = "http://quote.yahoo.com/d/quotes.csv?s=$TickerSymbol&f=sl1d1t1c1p2ohgv";
$Quote = "https://api.iextrading.com/1.0/stock/$TickerSymbol/book";
$QuoteString = file_get_contents($Quote);
echo $QuoteString;
?>