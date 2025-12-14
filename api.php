<?php
header('Content-Type: application/json; charset=utf-8');

$file = __DIR__ . '/content.json';

if (!file_exists($file)) {
  file_put_contents($file, "[]");
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  echo file_get_contents($file);
  exit;
}

if ($method === 'POST') {
  $raw = file_get_contents('php://input');
  if (!$raw) { http_response_code(400); echo json_encode(["error"=>"empty body"]); exit; }

  // Optionnel: validation JSON
  json_decode($raw, true);
  if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(["error"=>"invalid json"]);
    exit;
  }

  file_put_contents($file, $raw, LOCK_EX);
  echo json_encode(["ok"=>true]);
  exit;
}

http_response_code(405);
echo json_encode(["error"=>"method not allowed"]);
