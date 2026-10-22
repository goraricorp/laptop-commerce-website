CREATE DATABASE  IF NOT EXISTS `ws_proj` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `ws_proj`;
-- MySQL dump 10.13  Distrib 8.0.38, for macos14 (x86_64)
--
-- Host: 127.0.0.1    Database: ws_proj
-- ------------------------------------------------------
-- Server version	9.0.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `accessory`
--

DROP TABLE IF EXISTS `accessory`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accessory` (
  `idaccessory` int NOT NULL AUTO_INCREMENT,
  `idproduct` int NOT NULL,
  `nums_key` int NOT NULL,
  `switch_type` varchar(255) NOT NULL,
  `connection` varchar(255) NOT NULL,
  PRIMARY KEY (`idaccessory`),
  KEY `accessory_product_idx` (`idproduct`),
  CONSTRAINT `accessory_product` FOREIGN KEY (`idproduct`) REFERENCES `product` (`idproduct`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accessory`
--

LOCK TABLES `accessory` WRITE;
/*!40000 ALTER TABLE `accessory` DISABLE KEYS */;
/*!40000 ALTER TABLE `accessory` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `account`
--

DROP TABLE IF EXISTS `account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `account` (
  `idaccount` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `role` tinyint NOT NULL DEFAULT '0',
  `status` tinyint NOT NULL DEFAULT '0',
  `isverify` tinyint NOT NULL DEFAULT '0',
  `method` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `verificationtoken` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`idaccount`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account`
--

LOCK TABLES `account` WRITE;
/*!40000 ALTER TABLE `account` DISABLE KEYS */;
INSERT INTO `account` VALUES (1,'japtor','$2a$10$PjNnqC9LqrXCcpN5.pAwLeBFA85P9U4yvQo7ouOPWmEZQpsyL/6SC','japtor@gorth.org',1,0,1,NULL,NULL),(2,'payhd','$2a$10$yTptjx4mdOfCz9FNVFWd4ORSo8LSiWjPjseZSM2YvOSPh9sqQDgtu','',1,1,1,NULL,''),(3,'locst','$2a$10$X76yENp4ERXfAym26IoW3OrK5CmBfsYq9wUSJOmEAZdMrMpPyCrV2','',1,0,0,NULL,NULL),(4,'goraria','$2a$10$PjNnqC9LqrXCcpN5.pAwLeBFA85P9U4yvQo7ouOPWmEZQpsyL/6SC','',1,0,1,NULL,NULL),(5,'ichibulup','$2a$10$PjNnqC9LqrXCcpN5.pAwLeBFA85P9U4yvQo7ouOPWmEZQpsyL/6SC','',0,0,1,NULL,NULL),(6,'test','$2a$10$14XOoBaGY../QL66zi28q.0YZI.KFS3dRCyp4hyTfH5DtO3pczc5.','',0,0,1,NULL,NULL),(7,'demo','$2a$10$14XOoBaGY../QL66zi28q.0YZI.KFS3dRCyp4hyTfH5DtO3pczc5.','wefwef@dasd',0,0,1,NULL,NULL),(28,'L','$2b$10$duBgAjOAPKT2gXeOuvvTXOP/jP4dWP8JYpXgMUAjmTMC3zmZP7UDK','abc@gmail.com',0,0,0,NULL,NULL),(29,'locst','$2a$10$X76yENp4ERXfAym26IoW3OrK5CmBfsYq9wUSJOmEAZdMrMpPyCrV2','abc@gmail.com',0,0,0,NULL,NULL),(30,'asdfghjkl','$2a$10$PjNnqC9LqrXCcpN5.pAwLeBFA85P9U4yvQo7ouOPWmEZQpsyL/6SC','mail@mail.com',0,1,1,NULL,NULL),(34,'kkkk','$2a$10$WZFdmhaph1DcAxrcQpUyou2UcogZcGUYjHaM1NeKzrqTPMv0cYSDG','s@s.s',0,0,0,NULL,'8bd3452ef6fe26f182e64f22f95552426d17ff32'),(35,'tgp','$2a$10$fQhloBtnUnKw887ZHZ7EJ.Ane28KDj5O/bPkny6NLWHoH36w4VgnK','truonggiangpham.workspaces@gmail.com',0,0,0,NULL,'19e18baf7b76172c8c6ca04fe150e2010c296d04'),(36,'y','$2a$10$I94jknkXL2Cho2WSeRmzm.Y6hgacOGjaAPBQwSjymFHSQg6foXKRi','goraricorp@gmail.com',0,0,1,NULL,NULL),(37,'uipackgorth','','uipackgorth@gmail.com',0,0,1,'google',NULL),(38,'payhd2607','','payhd2607@gmail.com',0,0,1,'google','7dba9a40a56712ce5678907073797654031fff25'),(39,'pa106','$2a$10$yTptjx4mdOfCz9FNVFWd4ORSo8LSiWjPjseZSM2YvOSPh9sqQDgtu','nguyenthephananh106@gmail.com',0,0,1,NULL,NULL),(40,'visitor','$2a$10$14XOoBaGY../QL66zi28q.0YZI.KFS3dRCyp4hyTfH5DtO3pczc5.','s@s',0,0,1,NULL,'1df6673dc16b6532af5a271e893351cab3fee7ee'),(41,'gortheia','','gortheia@gmail.com',0,0,1,'google',NULL);
/*!40000 ALTER TABLE `account` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `address`
--

DROP TABLE IF EXISTS `address`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `address` (
  `idaddress` int NOT NULL AUTO_INCREMENT,
  `idaccount` int NOT NULL,
  `type` varchar(15) NOT NULL,
  `tower` varchar(255) NOT NULL,
  `street` varchar(255) NOT NULL,
  `district` varchar(255) NOT NULL,
  `city` varchar(255) NOT NULL,
  `state` varchar(255) NOT NULL,
  `country` varchar(255) NOT NULL,
  PRIMARY KEY (`idaddress`),
  KEY `address_account_idx` (`idaccount`),
  CONSTRAINT `address_account` FOREIGN KEY (`idaccount`) REFERENCES `account` (`idaccount`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `address`
--

LOCK TABLES `address` WRITE;
/*!40000 ALTER TABLE `address` DISABLE KEYS */;
INSERT INTO `address` VALUES (1,1,'Company','Gorth Tower','Henovia','San Siro','Milan','Madonnina','Italy'),(2,30,'Company','Tower B','Street 2','District 2','City 2','State 2','Country 2'),(3,30,'Company','Tower C','Street 3','District 3','City 3','State 3','Country 3'),(5,30,'Company','Tower E','Street 5','District 5','City 5','State 5','Country 5'),(6,30,'Company','Tower F','Street 6','District 6','City 6','State 6','Country 6'),(7,30,'Company','Tower G','Street 7','District 7','City 7','State 7','Country 7'),(8,30,'Home','Tower H','Street 8','District 8','City 8','State 8','Country 8'),(9,30,'Company','Tower 5','Street 5','District 5','City 5','State 5','Country 5'),(10,30,'Company','Tower J','Street 10','District 10','City 10','State 10','Country 10'),(11,30,'Home','Tower A','Street 1','District 1','City 1','State 1','Country 1'),(12,30,'Company','3','3','3','3','33dddddd','3'),(14,30,'Company','l','ll','l','l','ll','l'),(15,30,'Home','p','p','pp','p','p','p'),(16,30,'Home','p','p','p','p','p','p'),(17,30,'Home','pasasas','p','p','p','pp','p'),(18,30,'Company','sdfsdfsdf','k','k','k','k','k'),(19,30,'Company','psdfsdfsd','pkp','kjqio','hiuj','hiu','jhikuj'),(20,30,'Home','jk','hkj','h','kjh','kjh','kjh'),(21,30,'Company','dswqdqk','jnk','jhb','jkhbgh','jhg','jhg'),(22,30,'Company','jkhbn','hjkb','jhkb','jhb','jhb','jhb'),(23,30,'Home','hb','uhjb','bkjb','kb','kjb','kjb'),(24,30,'Home','dfgdfsgdsfgdf','g','jhg','jh','gjhg','jh'),(28,30,'Home','lk','ljlkj','lkj','lkj','lkj','lk'),(29,30,'Home','jljlkj','dfgdfgdfglkj','lj','lkj','lkj','llk'),(30,30,'Company','đáhklj','hkjh','kh','kjh','kjh','kh'),(31,30,'Home','home','home','vie','vie','vie','ita'),(32,39,'Home','a','a','a','a','a','a');
/*!40000 ALTER TABLE `address` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bill`
--

DROP TABLE IF EXISTS `bill`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bill` (
  `idbill` int NOT NULL AUTO_INCREMENT,
  `idaccount` int NOT NULL,
  `iddiscount` int DEFAULT NULL,
  `idaddress` int DEFAULT NULL,
  `date` datetime NOT NULL,
  `price` int DEFAULT NULL,
  `status` tinyint DEFAULT '0',
  PRIMARY KEY (`idbill`),
  KEY `bill_account_idx` (`idaccount`),
  KEY `bill_iddiscount_idx` (`iddiscount`),
  KEY `bill_idaddress_idx` (`idaddress`),
  CONSTRAINT `bill_account` FOREIGN KEY (`idaccount`) REFERENCES `account` (`idaccount`),
  CONSTRAINT `bill_idaddress` FOREIGN KEY (`idaddress`) REFERENCES `address` (`idaddress`),
  CONSTRAINT `bill_iddiscount` FOREIGN KEY (`iddiscount`) REFERENCES `discount` (`iddiscount`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bill`
--

LOCK TABLES `bill` WRITE;
/*!40000 ALTER TABLE `bill` DISABLE KEYS */;
INSERT INTO `bill` VALUES (1,1,1,NULL,'2024-09-29 00:00:00',NULL,0),(2,30,1,NULL,'2024-09-25 00:00:00',NULL,6),(3,29,1,1,'2024-09-29 00:00:00',NULL,4),(4,30,1,NULL,'2024-09-29 00:00:00',NULL,3),(5,29,1,NULL,'2024-09-29 00:00:00',NULL,2),(6,30,1,NULL,'2024-10-01 00:00:00',NULL,1),(7,29,1,6,'2024-09-29 00:00:00',NULL,5),(8,29,1,9,'2024-09-29 00:00:00',NULL,2),(9,30,1,NULL,'2024-10-03 00:00:00',NULL,0),(10,30,1,NULL,'2024-10-10 00:00:00',NULL,3),(11,29,1,NULL,'2024-09-29 00:00:00',NULL,0),(12,29,1,NULL,'2024-09-29 00:00:00',NULL,0),(13,30,1,NULL,'2024-10-19 00:00:00',NULL,4),(14,29,1,9,'2024-09-29 00:00:00',NULL,0),(15,30,1,NULL,'2024-10-29 00:00:00',NULL,5),(16,29,1,NULL,'2024-09-29 00:00:00',NULL,0),(17,30,1,12,'2024-11-03 18:03:34',5198,1),(18,30,NULL,2,'2024-12-17 16:17:31',7197,1),(19,39,NULL,32,'2024-12-21 01:56:26',2399,1);
/*!40000 ALTER TABLE `bill` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bill_detail`
--

DROP TABLE IF EXISTS `bill_detail`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bill_detail` (
  `idbill_details` int NOT NULL AUTO_INCREMENT,
  `idbill` int NOT NULL,
  `idproduct` int DEFAULT NULL,
  `idcolor` int DEFAULT NULL,
  `idconfiguration` int DEFAULT NULL,
  `idaccessory` int DEFAULT NULL,
  `product_name` varchar(255) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci NOT NULL,
  `quantity` int NOT NULL DEFAULT '0',
  `price` int NOT NULL,
  PRIMARY KEY (`idbill_details`),
  KEY `bill_detail_product_idx` (`idproduct`),
  KEY `bill_detail_configurarion_idx` (`idconfiguration`),
  KEY `bill_detail_accessory_idx` (`idaccessory`),
  KEY `bill_detail_color_idx` (`idcolor`),
  KEY `bill_detail_bill_idx` (`idbill`),
  CONSTRAINT `bill_detail_accessory` FOREIGN KEY (`idaccessory`) REFERENCES `accessory` (`idaccessory`),
  CONSTRAINT `bill_detail_bill` FOREIGN KEY (`idbill`) REFERENCES `bill` (`idbill`),
  CONSTRAINT `bill_detail_color` FOREIGN KEY (`idcolor`) REFERENCES `color` (`idcolor`),
  CONSTRAINT `bill_detail_configurarion` FOREIGN KEY (`idconfiguration`) REFERENCES `configuration` (`idconfiguration`),
  CONSTRAINT `bill_detail_product` FOREIGN KEY (`idproduct`) REFERENCES `product` (`idproduct`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bill_detail`
--

LOCK TABLES `bill_detail` WRITE;
/*!40000 ALTER TABLE `bill_detail` DISABLE KEYS */;
INSERT INTO `bill_detail` VALUES (5,17,6,NULL,15,NULL,'',3,1000),(6,17,3,NULL,3,NULL,'',4,1000),(7,18,3,NULL,3,NULL,'',3,1000),(8,19,3,5,3,NULL,'',1,1000);
/*!40000 ALTER TABLE `bill_detail` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `brand`
--

DROP TABLE IF EXISTS `brand`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `brand` (
  `idbrand` int NOT NULL AUTO_INCREMENT,
  `brand_name` varchar(255) NOT NULL,
  PRIMARY KEY (`idbrand`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `brand`
--

LOCK TABLES `brand` WRITE;
/*!40000 ALTER TABLE `brand` DISABLE KEYS */;
INSERT INTO `brand` VALUES (1,'Apple'),(2,'Dell'),(3,'Lenovo'),(4,'Asus'),(5,'ROG'),(6,'HP'),(7,'Acer'),(8,'Razer'),(9,'Microsoft');
/*!40000 ALTER TABLE `brand` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart`
--

DROP TABLE IF EXISTS `cart`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart` (
  `idcart` int NOT NULL AUTO_INCREMENT,
  `idaccount` int NOT NULL,
  PRIMARY KEY (`idcart`),
  KEY `cart_account_idx` (`idaccount`),
  CONSTRAINT `cart_account` FOREIGN KEY (`idaccount`) REFERENCES `account` (`idaccount`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart`
--

LOCK TABLES `cart` WRITE;
/*!40000 ALTER TABLE `cart` DISABLE KEYS */;
INSERT INTO `cart` VALUES (1,1),(2,2),(5,5),(6,6),(7,7),(3,29),(4,30),(8,34),(9,35),(10,36),(11,39),(12,41);
/*!40000 ALTER TABLE `cart` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_item`
--

DROP TABLE IF EXISTS `cart_item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_item` (
  `idcart_item` int NOT NULL AUTO_INCREMENT,
  `idcart` int NOT NULL,
  `idproduct` int DEFAULT NULL,
  `idcolor` int DEFAULT NULL,
  `idconfiguration` int DEFAULT NULL,
  `idaccessory` int DEFAULT NULL,
  `quantity` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`idcart_item`),
  KEY `cart_item_cart_idx` (`idcart`),
  KEY `cart_item_configuration_idx` (`idconfiguration`),
  KEY `cart_item_color_idx` (`idcolor`),
  KEY `cart_item_accessory_idx` (`idaccessory`),
  KEY `cart_item_product_idx` (`idproduct`),
  CONSTRAINT `cart_item_accessory` FOREIGN KEY (`idaccessory`) REFERENCES `accessory` (`idaccessory`),
  CONSTRAINT `cart_item_cart` FOREIGN KEY (`idcart`) REFERENCES `cart` (`idcart`),
  CONSTRAINT `cart_item_color` FOREIGN KEY (`idcolor`) REFERENCES `color` (`idcolor`),
  CONSTRAINT `cart_item_configuration` FOREIGN KEY (`idconfiguration`) REFERENCES `configuration` (`idconfiguration`),
  CONSTRAINT `cart_item_product` FOREIGN KEY (`idproduct`) REFERENCES `product` (`idproduct`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_item`
--

LOCK TABLES `cart_item` WRITE;
/*!40000 ALTER TABLE `cart_item` DISABLE KEYS */;
INSERT INTO `cart_item` VALUES (3,4,3,NULL,3,NULL,3),(4,4,4,NULL,13,NULL,5),(5,4,1,1,1,NULL,4),(7,11,3,5,3,NULL,1),(10,11,4,NULL,13,NULL,1),(11,12,3,5,3,NULL,1),(12,12,4,7,13,NULL,1),(13,12,6,11,15,NULL,1);
/*!40000 ALTER TABLE `cart_item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category`
--

DROP TABLE IF EXISTS `category`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `category` (
  `idcategory` int NOT NULL AUTO_INCREMENT,
  `category_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `category_description` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `category_image` varchar(1023) CHARACTER SET utf8mb3 COLLATE utf8mb3_general_ci DEFAULT NULL,
  PRIMARY KEY (`idcategory`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category`
--

LOCK TABLES `category` WRITE;
/*!40000 ALTER TABLE `category` DISABLE KEYS */;
INSERT INTO `category` VALUES (1,'Laptop','Professional Laptop','product-7.png'),(2,'Keyboard','Mechanical','product-11.png'),(3,'Mouse','Gaming','product-12.png'),(4,'Tablet','Nice for work','product-15.png'),(5,'Smartphone','Quanlity','product-1.png'),(6,'Smartwatch','More than watch','product-5.png'),(7,'Book','Knowledge','product-25.png'),(8,'Screen','High Resolution','product-13.png'),(9,'Play Station','Box for Play','product-17.png'),(10,'Camera','Take Photo','product-18.png'),(11,'Sound','Dolby','product-2.png'),(23,'','',''),(24,'','',''),(25,'','','');
/*!40000 ALTER TABLE `category` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `color`
--

DROP TABLE IF EXISTS `color`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `color` (
  `idcolor` int NOT NULL AUTO_INCREMENT,
  `idproduct` int NOT NULL,
  `color` varchar(255) NOT NULL,
  PRIMARY KEY (`idcolor`),
  KEY `color_product_idx` (`idproduct`),
  CONSTRAINT `color_product` FOREIGN KEY (`idproduct`) REFERENCES `product` (`idproduct`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `color`
--

LOCK TABLES `color` WRITE;
/*!40000 ALTER TABLE `color` DISABLE KEYS */;
INSERT INTO `color` VALUES (1,1,'dark'),(3,2,'light'),(4,2,'dark'),(5,3,'light'),(6,3,'dark'),(7,4,'light'),(8,4,'dark'),(9,5,'light'),(10,5,'dark'),(11,6,'light'),(12,6,'dark'),(13,7,'light'),(14,7,'dark'),(15,8,'light'),(16,8,'dark'),(17,9,'light'),(18,9,'dark'),(19,10,'light'),(20,10,'dark'),(21,11,'light'),(22,11,'dark'),(23,12,'light'),(24,12,'dark');
/*!40000 ALTER TABLE `color` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configuration`
--

DROP TABLE IF EXISTS `configuration`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuration` (
  `idconfiguration` int NOT NULL AUTO_INCREMENT,
  `idproduct` int NOT NULL,
  `cpu` varchar(255) DEFAULT NULL,
  `ram` int DEFAULT NULL,
  `gpu` varchar(255) DEFAULT 'Onboard',
  `storage` int DEFAULT NULL,
  `screen` int NOT NULL,
  `resolution` varchar(15) NOT NULL,
  `price` int NOT NULL,
  `quantity` int NOT NULL DEFAULT '0',
  PRIMARY KEY (`idconfiguration`),
  KEY `configuration_product_idx` (`idproduct`),
  CONSTRAINT `configuration_product` FOREIGN KEY (`idproduct`) REFERENCES `product` (`idproduct`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuration`
--

LOCK TABLES `configuration` WRITE;
/*!40000 ALTER TABLE `configuration` DISABLE KEYS */;
INSERT INTO `configuration` VALUES (1,1,'Intel core Ultra 7',16,'NVIDIA RTX 3060',512,14,'1980X1080',999,0),(2,1,'Intel core i5',32,'NVIDIA RTX 4060',512,15,'1920X1080',1999,0),(3,3,'M4 Pro',16,'Integrated',512,16,'3072X1920',2399,0),(4,1,'Intel core i9',64,'NVIDIA RTX 4080',2048,17,'3840X2160',3299,0),(5,3,'Intel core Ultra 7',8,'Intel UHD',256,13,'2560X1440',899,0),(6,3,'Intel core i5',16,'Intel Iris',512,15,'1920X1080',1499,0),(7,1,'AMD Ryzen 5',32,'NVIDIA RTX 2060',512,15,'1920X1080',1799,0),(8,1,'AMD Ryzen 7',16,'NVIDIA RTX 3060',1024,15,'2560X1440',2199,0),(9,3,'M3 Max',32,'Integrated',1024,16,'3456X2234',2999,0),(10,1,'Intel core i7',32,'NVIDIA RTX 4070',1024,15,'2560X1600',2699,0),(11,2,'Intel core i7',32,'NVIDIA RTX 4070',1024,15,'2560X1600',2699,0),(12,3,'Intel core i9',64,'NVIDIA RTX 3060',2048,17,'3840X2160',3499,0),(13,4,'AMD Ryzen 7',16,'AMD Radeon RX 5600M',512,14,'1920X1080',1599,0),(14,5,'Intel core i5',8,'Intel UHD Graphics',256,13,'2560X1440',999,0),(15,6,'AMD Ryzen 9',32,'NVIDIA RTX 3080',1024,15,'2560X1440',2799,0),(16,7,'AMD Ryzen 7',4,'Intel UHD Graphics',128,12,'3840X2160',799,0),(17,8,'Apple M4',16,'Apple M1 GPU',512,13,'2560X1600',1999,0),(18,9,'Intel core i7',32,'NVIDIA RTX 3070',1024,17,'3840X2160',2999,0),(19,10,'AMD Ryzen 5',16,'AMD Radeon RX 5500M',512,15,'1920X1080',1899,0),(20,11,'Intel core i9',64,'NVIDIA RTX 3090',4096,17,'3840X2400',4999,0),(21,12,'AMD Ryzen 7',32,'NVIDIA GTX 1660 Ti',1024,15,'2560X1440',2499,0),(22,2,'Intel core i9',64,'NVIDIA RTX 3090',4096,15,'2560X1440',4999,0);
/*!40000 ALTER TABLE `configuration` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `description`
--

DROP TABLE IF EXISTS `description`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `description` (
  `iddescription` int NOT NULL AUTO_INCREMENT,
  `idproduct` int NOT NULL,
  `title_description` varchar(255) DEFAULT NULL,
  `sub_description` varchar(2047) DEFAULT NULL,
  `img_description` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`iddescription`),
  KEY `sescription_product_idx` (`idproduct`),
  CONSTRAINT `sescription_product` FOREIGN KEY (`idproduct`) REFERENCES `product` (`idproduct`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `description`
--

LOCK TABLES `description` WRITE;
/*!40000 ALTER TABLE `description` DISABLE KEYS */;
INSERT INTO `description` VALUES (1,1,'Powerful gaming laptop for Acer fans','Great for high-performance gaming','Acer Nitro 5 image'),(2,2,'High-end business laptop','Ideal for productivity and office tasks','Lenovo ThinkBook image'),(3,3,'Best in class Apple laptop','Great performance and design for professionals','MacBook Pro image'),(4,4,'Corsair mechanical keyboard','Fast response and customizable keys','Corsair K95 image'),(5,5,'Ergonomic wireless mouse','Ideal for long working hours','Logitech MX Master 3 image'),(6,6,'Premium ultrabook with excellent display','Sleek design and top performance','Dell XPS 15 image'),(7,7,'Mechanical gaming keyboard','Excellent key feedback for gamers','Razer BlackWidow image'),(8,8,'High-precision gaming mouse','Best for FPS gaming','Razer DeathAdder image'),(9,9,'Convertible ultrabook with pen support','Great for productivity and creativity','HP Spectre x360 image'),(10,10,'High-performance gaming headset','Exceptional sound quality for esports','Logitech G Pro X image'),(11,11,'Best-in-class gaming mouse','Perfect for competitive gaming','SteelSeries Rival 600 image'),(12,12,'Slim and powerful gaming laptop','Excellent cooling and gaming performance','Asus ROG Zephyrus image');
/*!40000 ALTER TABLE `description` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `discount`
--

DROP TABLE IF EXISTS `discount`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `discount` (
  `iddiscount` int NOT NULL AUTO_INCREMENT,
  `discount_name` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `percentage_discount` int NOT NULL DEFAULT '0',
  `value_discount` int NOT NULL DEFAULT '0',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` tinyint NOT NULL DEFAULT '0',
  PRIMARY KEY (`iddiscount`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `discount`
--

LOCK TABLES `discount` WRITE;
/*!40000 ALTER TABLE `discount` DISABLE KEYS */;
INSERT INTO `discount` VALUES (1,'GOR100',10,0,'2024-09-09','2024-10-10',1);
/*!40000 ALTER TABLE `discount` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product`
--

DROP TABLE IF EXISTS `product`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product` (
  `idproduct` int NOT NULL AUTO_INCREMENT,
  `idcategory` int NOT NULL,
  `brand` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `product_name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `product_image` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `status` tinyint NOT NULL DEFAULT '1',
  PRIMARY KEY (`idproduct`),
  KEY `product_category_idx` (`idcategory`),
  CONSTRAINT `product_category` FOREIGN KEY (`idcategory`) REFERENCES `category` (`idcategory`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product`
--

LOCK TABLES `product` WRITE;
/*!40000 ALTER TABLE `product` DISABLE KEYS */;
INSERT INTO `product` VALUES (1,1,'Acer','Nitro 5 Tiger','https://imagor.owtg.one/unsafe/fit-in/1000x1000/filters:quality(100)/https://d28jzcg6y4v9j1.cloudfront.net/media/core/products/2024/10/8/laptop-gaming-acer-nitro-v-undefined-ZAI.jpg',0),(2,1,'Lenovo','ThinkBook','https://imagor.owtg.one/unsafe/fit-in/1000x1000/filters:quality(100)/https://d28jzcg6y4v9j1.cloudfront.net/media/core/products/2024/2/21/lenovo-thinkbook-14-g6-thinkpro.jpg',1),(3,1,'Apple','MacBook Air','https://imagor.owtg.one/unsafe/fit-in/1000x1000/filters:quality(100)/https://d28jzcg6y4v9j1.cloudfront.net/media/core/products/2022/9/30/macbook-air-2022-m2-04-thinkpro-1.png',1),(4,2,'Dell','Inspiron','https://imagor.owtg.one/unsafe/fit-in/1000x1000/filters:quality(100)/https://d28jzcg6y4v9j1.cloudfront.net/media/core/products/2023/3/14/in5630nt-cnb-00000ff090-sl.jpg',1),(5,3,'Asus','Vivobook','https://imagor.owtg.one/unsafe/fit-in/1000x1000/filters:quality(100)/https://d28jzcg6y4v9j1.cloudfront.net/media/core/products/2024/10/23/laptop-asus-gaming-vivobook-k3605zf-rp634w-undefined.jpg',1),(6,1,'Dell','XPS 15','https://imagor.owtg.one/unsafe/fit-in/1000x1000/filters:quality(100)/https://d28jzcg6y4v9j1.cloudfront.net/media/core/products/2024/11/14/dell-xps-15-9520-album-0mn-thinkpro.vn.jpeg',1),(7,2,'Lenovo','Ideapad Slim 3','https://imagor.owtg.one/unsafe/fit-in/1000x1000/filters:quality(100)/https://media-api-beta.thinkpro.vn/media/core/products/2024/11/14/lenovo-ideapad-slim-5-14imh9-83da006tvn-undefined.jpg',0),(8,3,'Acer','Swift','https://imagor.owtg.one/unsafe/fit-in/1000x1000/filters:quality(100)/https://d28jzcg6y4v9j1.cloudfront.net/media/core/products/2024/7/12/acer-swift-go-16-2023-undefined.jpg',1),(9,1,'HP','Pavilion','https://imagor.owtg.one/unsafe/fit-in/1000x1000/filters:quality(100)/https://d28jzcg6y4v9j1.cloudfront.net/media/core/products/2024/10/10/hp-pavilion-plus-14-ew1006na-undefined.jpg',1),(10,2,'Asus','ZenBook','https://imagor.owtg.one/unsafe/fit-in/1000x1000/filters:quality(100)/https://media-api-beta.thinkpro.vn/media/core/products/2024/10/23/laptop-asus-zenbook-s14-oled-ux5406sa-pv140ws-undefined.jpg',1),(11,3,'Asus','ROG Zephyrus','https://imagor.owtg.one/unsafe/fit-in/1000x1000/filters:quality(100)/https://d28jzcg6y4v9j1.cloudfront.net/media/core/products/2024/3/20/asus-rog-zephyrus-g14-2024-thinkpro.jpeg',1),(12,1,'Asus','TUF','https://imagor.owtg.one/unsafe/fit-in/1000x1000/filters:quality(100)/https://d28jzcg6y4v9j1.cloudfront.net/media/core/products/2024/9/29/laptop-asus-tuf-gaming-a14-fa401wv-rg062ws-undefined-8HV.jpg',1);
/*!40000 ALTER TABLE `product` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rating`
--

DROP TABLE IF EXISTS `rating`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rating` (
  `idrating` int NOT NULL AUTO_INCREMENT,
  `idaccount` int NOT NULL,
  `idproduct` int NOT NULL,
  `score` int NOT NULL,
  `comment` varchar(1023) DEFAULT NULL,
  `rating_date` datetime NOT NULL,
  PRIMARY KEY (`idrating`),
  KEY `rating_account_idx` (`idaccount`),
  KEY `rating_product_idx` (`idproduct`),
  CONSTRAINT `rating_account` FOREIGN KEY (`idaccount`) REFERENCES `account` (`idaccount`),
  CONSTRAINT `rating_product` FOREIGN KEY (`idproduct`) REFERENCES `product` (`idproduct`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rating`
--

LOCK TABLES `rating` WRITE;
/*!40000 ALTER TABLE `rating` DISABLE KEYS */;
INSERT INTO `rating` VALUES (1,30,1,4,'Sản phẩm ổn','2024-09-10 10:15:00'),(2,6,2,5,'Rất tốt','2024-09-09 12:20:00'),(3,6,3,4,'Cipher','2024-12-25 04:40:58'),(4,30,4,2,'Không hài lòng lắm','2024-09-07 16:40:00'),(5,6,5,5,'Tuyệt vời','2024-09-06 18:50:00'),(6,7,6,1,'Cần cải thiện','2024-09-05 11:00:00'),(7,30,7,4,'Ổn áp cho tầm giá','2024-09-04 13:10:00'),(8,6,8,5,'Sản phẩm đáng mua','2024-09-03 15:20:00'),(9,7,9,0,'Không nên mua','2024-09-02 17:30:00'),(10,30,10,3,'Cũng được','2024-09-01 19:40:00'),(11,7,11,4,'Chất lượng tốt','2024-08-31 09:50:00'),(12,30,12,5,'Rất hài lòng','2024-08-30 11:05:00'),(13,6,1,2,'Hàng không ổn','2024-08-29 13:15:00'),(14,30,2,3,'Trung bình','2024-08-28 15:25:00'),(15,30,3,5,'Wonderful','2024-08-27 17:35:00'),(16,7,4,5,'Đáng giá','2024-08-26 19:45:00'),(17,30,5,4,'Ổn nhưng hơi đắt','2024-08-25 10:55:00'),(18,30,6,0,'Quá tệ','2024-08-24 12:05:00'),(19,6,7,5,'Xuất sắc','2024-08-23 14:15:00'),(20,30,8,2,'Chưa tốt','2024-08-22 16:25:00'),(21,39,3,3,'Just Normal','2024-12-25 04:45:21'),(22,40,3,2,'No surprise','2024-12-25 04:46:21'),(23,41,3,3,'Peace','2024-12-24 14:45:21'),(24,37,3,5,'Beautiful','2024-12-25 04:45:50'),(25,7,3,4,'Wonderful by Bill','2024-12-24 11:15:01'),(26,5,3,1,'Bad','2024-12-25 04:57:58'),(27,38,3,4,'Good','2024-12-25 04:58:06');
/*!40000 ALTER TABLE `rating` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `temporary`
--

DROP TABLE IF EXISTS `temporary`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `temporary` (
  `idtemporary` int NOT NULL,
  `token_verify` varchar(1023) DEFAULT NULL,
  PRIMARY KEY (`idtemporary`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `temporary`
--

LOCK TABLES `temporary` WRITE;
/*!40000 ALTER TABLE `temporary` DISABLE KEYS */;
/*!40000 ALTER TABLE `temporary` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
  `iduser` int NOT NULL AUTO_INCREMENT,
  `idaccount` int NOT NULL,
  `firstname` varchar(255) DEFAULT NULL,
  `lastname` varchar(255) DEFAULT NULL,
  `phone_number` varchar(15) NOT NULL,
  `avatar` varchar(255) NOT NULL DEFAULT '../assets/img/avatars/1.png',
  `birthday` datetime DEFAULT NULL,
  PRIMARY KEY (`iduser`),
  KEY `user_account_idx` (`idaccount`),
  CONSTRAINT `user_account` FOREIGN KEY (`idaccount`) REFERENCES `account` (`idaccount`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,1,'Japtor Goraria el Destine','de Gortheia Gorthenburg','0869692098','../assets/img/avatars/8.png',NULL),(2,30,'Xiao-Jiang','Fan','0232453453','../assets/img/avatars/11.png',NULL),(3,29,'Messi','Ronaldo','1111111111','../assets/img/avatars/1.png',NULL),(4,4,'Japtor','Goraria','0869692098','../assets/img/avatars/3.png',NULL),(5,5,'Ichibulup','Gortheia','0869692098','../assets/img/avatars/13.png',NULL),(6,6,'Test','Account','0869234325','../assets/img/avatars/14.png',NULL),(7,7,'Demo','Account','3245234234','../assets/img/avatars/4.png',NULL),(8,34,'Glasner','White','0909090909','../assets/img/avatars/1.png',NULL),(9,35,'Ashley','Black','0989898797','../assets/img/avatars/1.png',NULL),(10,36,'Oliver','Gorthenburg','0450345034','../assets/img/avatars/1.png',NULL),(11,37,'UI Pack','Discord','4564560003','https://lh3.googleusercontent.com/a/ACg8ocLxDVOLX_CIZQl94mt5f4QhKzGonchTl6bQvPYVo5v1lXLIzoY=s96-c',NULL),(12,38,'Anh','Nguyễn','','https://lh3.googleusercontent.com/a/ACg8ocLN4cAggypLSONUENEHNRRPT7unRiw5CylJHHr1sKGOGOUXlQ=s96-c',NULL),(13,39,'Phan Anh','Nguyễn Thế ','0123214124','../assets/img/avatars/2.png',NULL),(15,40,'Victoria','Ratcliff','1111111111','../assets/img/avatars/1.png',NULL),(16,41,'Japtor el Destinia','de Gortheia','','https://lh3.googleusercontent.com/a/ACg8ocIpYxOZ_caNmVInJBz_fnjl13KPHs2O4m8kf_oP02Udo3bTMw=s96-c',NULL);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2024-12-25 22:03:39
