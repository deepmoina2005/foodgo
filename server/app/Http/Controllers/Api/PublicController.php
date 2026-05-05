<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\PublicService;
use Illuminate\Http\Request;

class PublicController extends Controller
{
    public function __construct(private readonly PublicService $service)
    {
    }

    public function restaurantsIndex(Request $request)
    {
        return $this->service->restaurantsIndex($request);
    }

    public function restaurantsShow(int $id)
    {
        return $this->service->restaurantsShow($id);
    }

    public function restaurantsMenu(int $id)
    {
        return $this->service->restaurantsMenu($id);
    }

    public function foodsIndex(Request $request)
    {
        return $this->service->foodsIndex($request);
    }

    public function foodsShow(int $id)
    {
        return $this->service->foodsShow($id);
    }

    public function categoriesIndex()
    {
        return $this->service->categoriesIndex();
    }
}
