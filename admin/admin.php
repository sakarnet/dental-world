<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

date_default_timezone_set('Asia/Yekaterinburg');

$valid_username = 'admin';
$valid_password = 'admin123';

if (!isset($_SERVER['PHP_AUTH_USER']) || 
    !isset($_SERVER['PHP_AUTH_PW']) ||
    $_SERVER['PHP_AUTH_USER'] != $valid_username || 
    $_SERVER['PHP_AUTH_PW'] != $valid_password) {
    
    header('WWW-Authenticate: Basic realm="Admin Area"');
    header('HTTP/1.0 401 Unauthorized');
    echo 'Требуется авторизация';
    exit;
}

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


if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['delete']) && isset($_POST['id'])) {
        $id = (int)$_POST['id'];
        $stmt = $pdo->prepare("DELETE FROM appointments WHERE id = ?");
        $stmt->execute([$id]);
        header('Location: admin.php'); 
        exit;
    }
    if (isset($_POST['toggle_done']) && isset($_POST['id'])) {
        $id = (int)$_POST['id'];
        $stmt = $pdo->prepare("UPDATE appointments SET is_done = NOT is_done WHERE id = ?");
        $stmt->execute([$id]);
        header('Location: admin.php');
        exit;
    }
}


$stmt = $pdo->query("SELECT * FROM appointments ORDER BY created_at DESC");
$appointments = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>

<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Админ-панель | Dental World</title>
    <style>
        * {
            box-sizing: border-box;
            font-family: Arial, sans-serif;
        }
        body {
            background: #f5f5f5;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            padding: 20px;
        }
        h1 {
            color: #333;
            margin-top: 0;
            border-bottom: 2px solid #4aa6df;
            padding-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th {
            background: #4aa6df;
            color: white;
            padding: 12px;
            font-weight: normal;
            text-align: left;
        }
        td {
            padding: 10px 12px;
            border-bottom: 1px solid #ddd;
            vertical-align: middle;
        }
        tr:hover {
            background: #f9f9f9;
        }
        .status-done {
            background: #e8f5e9;
            color: #2e7d32;
        }
        .status-pending {
            background: #ffebee;
            color: #c62828;
        }
        .btn {
            display: inline-block;
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            text-decoration: none;
        }
        .btn-delete {
            background: #f44336;
            color: white;
        }
        .btn-delete:hover {
            background: #d32f2f;
        }
        .btn-toggle {
            background: #ff9800;
            color: white;
        }
        .btn-toggle:hover {
            background: #f57c00;
        }
        .btn-home {
            background: #4aa6df;
            color: white;
            padding: 10px 20px;
            display: inline-block;
            margin-top: 20px;
            border-radius: 4px;
            text-decoration: none;
        }
        .btn-home:hover {
            background: #2f92cf;
        }
        .empty-message {
            text-align: center;
            padding: 40px;
            color: #777;
            font-style: italic;
        }
    
        @media (max-width: 768px) {
            table, thead, tbody, th, td, tr {
                display: block;
            }
            thead tr {
                position: absolute;
                top: -9999px;
                left: -9999px;
            }
            tr {
                border: 1px solid #ccc;
                margin-bottom: 10px;
                border-radius: 4px;
            }
            td {
                border: none;
                border-bottom: 1px solid #eee;
                position: relative;
                padding-left: 50%;
                white-space: normal;
                text-align: left;
            }
            td:before {
                position: absolute;
                top: 10px;
                left: 12px;
                width: 45%;
                padding-right: 10px;
                white-space: nowrap;
                font-weight: bold;
                content: attr(data-label);
            }
            td:last-child {
                border-bottom: 0;
            }
            .btn {
                width: 100%;
                margin-bottom: 5px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Заявки на приём</h1>

        <?php if (count($appointments) === 0): ?>
            <div class="empty-message">Пока нет заявок.</div>
        <?php else: ?>
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Имя</th>
                        <th>Телефон</th>
                        <th>Комментарий</th>
                        <th>Дата</th>
                        <th>Статус</th>
                        <th>Действия</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($appointments as $row): 
                        $statusClass = $row['is_done'] ? 'status-done' : 'status-pending';
                        $statusText = $row['is_done'] ? 'Выполнено' : 'Новая';
                    
                        // 13 часов смещение
                        $offsetHours = 13;
                        $timestamp = strtotime($row['created_at']) + $offsetHours * 3600;
                        $localDate = date('Y-m-d H:i:s', $timestamp);
                    ?>
                    <tr class="<?= $statusClass ?>">
                        <td data-label="ID"><?= htmlspecialchars($row['id']) ?></td>
                        <td data-label="Имя"><?= htmlspecialchars($row['name']) ?></td>
                        <td data-label="Телефон"><?= htmlspecialchars($row['phone']) ?></td>
                        <td data-label="Комментарий"><?= htmlspecialchars($row['comment']) ?: '—' ?></td>
                        <td data-label="Дата"><?= htmlspecialchars($localDate) ?></td>
                        <td data-label="Статус"><?= $statusText ?></td>
                        <td data-label="Действия">
                            <form method="post" style="display:inline;">
                                <input type="hidden" name="id" value="<?= $row['id'] ?>">
                                <button type="submit" name="toggle_done" class="btn btn-toggle" title="Отметить как выполненное/невыполненное">✓</button>
                            </form>
                            <form method="post" style="display:inline;" onsubmit="return confirm('Удалить заявку?');">
                                <input type="hidden" name="id" value="<?= $row['id'] ?>">
                                <button type="submit" name="delete" class="btn btn-delete">✗</button>
                            </form>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>

        <a href="../index.html" class="btn-home">← На главную</a>
    </div>
</body>
</html>