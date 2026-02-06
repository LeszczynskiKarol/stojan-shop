<?php
$url = "http://localhost:3000" . $_SERVER['REQUEST_URI'];

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

echo $response;
