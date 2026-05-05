# FoodGo Server

Laravel + MySQL REST API for the FoodGo food delivery platform.

## Tech Stack

- PHP
- Laravel
- MySQL
- Laravel Sanctum
- DB Facade / Query Builder only

## Setup

```bash
cd server
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --force
php artisan db:seed --force
php artisan serve
```

## Database

Use a local MySQL database named `food_delivery`.

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=food_delivery
DB_USERNAME=root
DB_PASSWORD=
```

## Features

- Sanctum auth
- Role-based API protection
- Customer, vendor, admin, and delivery modules
- COD-only checkout
- Database notifications
- Orders, cart, reviews, complaints, reports, payouts, and assignments

## Sample Credentials

- Admin: `admin@fooddelivery.com` / `Admin@123456`
- Customer: `customer@example.com` / `Password@123`
- Vendor: `vendor@example.com` / `Password@123`
- Delivery: `delivery@example.com` / `Password@123`
