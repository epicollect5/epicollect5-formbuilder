<?php

$date = new DateTime();
$data = file_get_contents('php://input');

if (file_put_contents("../project/project.json", $data)) {
    http_response_code(200);
    echo '{"response" : 1}';
} else {
    http_response_code(400);
    echo '{"response" : 0}';
}

