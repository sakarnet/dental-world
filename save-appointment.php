<?php
// save-appointment.php


$host = 'sql200.infinityfree.com'; 
$dbname = 'if0_41245327_dental_clinic'; 
$username = 'if0_41245327'; 
$password = 'vesoLqJKEATrP';


try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die("Ошибка подключения: " . $e->getMessage());
}


$name = $_POST['name'] ?? '';
$phone = $_POST['phone'] ?? '';
$comment = $_POST['comment'] ?? '';


if (empty($name) || empty($phone)) {
    die("Имя и телефон обязательны для заполнения");
}


$sql = "INSERT INTO appointments (name, phone, comment) VALUES (:name, :phone, :comment)";
$stmt = $pdo->prepare($sql);


$stmt->execute([
    ':name' => $name,
    ':phone' => $phone,
    ':comment' => $comment
]);


echo "success";
?>