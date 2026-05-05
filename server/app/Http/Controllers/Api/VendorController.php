<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Auth\ProfileRequest;
use App\Http\Requests\Api\Vendor\FoodItemRequest;
use App\Http\Requests\Api\Vendor\RestaurantRequest;
use App\Services\VendorService;
use Illuminate\Http\Request;

class VendorController extends Controller
{
    public function __construct(private readonly VendorService $service)
    {
    }

    public function profile()
    {
        return $this->service->profile();
    }

    public function profileUpdate(ProfileRequest $request)
    {
        return $this->service->profileUpdate($request);
    }

    public function restaurantShow()
    {
        return $this->service->restaurantShow();
    }

    public function restaurantStore(RestaurantRequest $request)
    {
        return $this->service->restaurantStore($request);
    }

    public function restaurantUpdate(RestaurantRequest $request)
    {
        return $this->service->restaurantUpdate($request);
    }

    public function documentsStore(Request $request)
    {
        return $this->service->documentsStore($request);
    }

    public function foodsIndex(Request $request)
    {
        return $this->service->foodsIndex($request);
    }

    public function foodsStore(FoodItemRequest $request)
    {
        return $this->service->foodsStore($request);
    }

    public function foodsShow(int $id)
    {
        return $this->service->foodsShow($id);
    }

    public function foodsUpdate(FoodItemRequest $request, int $id)
    {
        return $this->service->foodsUpdate($request, $id);
    }

    public function foodsDestroy(int $id)
    {
        return $this->service->foodsDestroy($id);
    }

    public function foodsStock(int $id)
    {
        return $this->service->foodsStock($id);
    }

    public function foodsStatus(int $id)
    {
        return $this->service->foodsStatus($id);
    }

    public function ordersIndex()
    {
        return $this->service->ordersIndex();
    }

    public function ordersShow(int $id)
    {
        return $this->service->ordersShow($id);
    }

    public function ordersAccept(int $id)
    {
        return $this->service->ordersAccept($id);
    }

    public function ordersReject(int $id)
    {
        return $this->service->ordersReject($id);
    }

    public function ordersStatus(Request $request, int $id)
    {
        return $this->service->ordersStatus($request, $id);
    }

    public function ordersInvoice(int $id)
    {
        return $this->service->ordersInvoice($id);
    }

    public function dashboard()
    {
        return $this->service->dashboard();
    }

    public function reportsSales()
    {
        return $this->service->reportsSales();
    }

    public function reportsBestSelling()
    {
        return $this->service->reportsBestSelling();
    }

    public function reviewsIndex()
    {
        return $this->service->reviewsIndex();
    }

    public function payoutsIndex()
    {
        return $this->service->payoutsIndex();
    }
}
