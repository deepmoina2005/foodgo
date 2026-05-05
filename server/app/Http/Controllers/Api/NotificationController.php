<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\NotificationService;

class NotificationController extends Controller
{
    public function __construct(private readonly NotificationService $service)
    {
    }

    public function index()
    {
        return $this->service->index(request());
    }

    public function read(int $id)
    {
        return $this->service->read($id);
    }

    public function readAll()
    {
        return $this->service->readAll();
    }
}
