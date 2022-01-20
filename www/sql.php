<?php
	try {
		$db = new PDO('mysql:host=localhost;dbname=coins', 'root', 'q8C03YF2YitQVjC9', array(PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8"));
	} catch (PDOException $e) {
		exit($e->getMessage());
	}
?>