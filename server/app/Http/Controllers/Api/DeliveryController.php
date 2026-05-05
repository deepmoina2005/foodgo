<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Delivery\KycRequest;
use App\Http\Requests\Api\Delivery\ProfileRequest;
use App\Services\DeliveryService;
use Illuminate\Http\Request;

class DeliveryController extends Controller
{
    public function __construct(private readonly DeliveryService $service)
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

    public function availabilityUpdate(Request $request)
    {
        return $this->service->availabilityUpdate($request);
    }

    public function availableRequestsIndex()
    {
        return $this->service->availableRequestsIndex();
    }

    public function availableRequestsShow(int $id)
    {
        return $this->service->availableRequestsShow($id);
    }

    public function availableRequestsAccept(int $id)
    {
        return $this->service->availableRequestsAccept($id);
    }

    public function kycStore(KycRequest $request)
    {
        return $this->service->kycStore($request);
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

    public function ordersPickup(int $id)
    {
        return $this->service->ordersPickup($id);
    }

    public function ordersStatus(Request $request, int $id)
    {
        return $this->service->ordersStatus($request, $id);
    }

    public function ordersDelivered(int $id)
    {
        return $this->service->ordersDelivered($id);
    }

    public function historyIndex()
    {
        return $this->service->historyIndex();
    }

    public function earningsIndex()
    {
        return $this->service->earningsIndex();
    }

    public function ratingsIndex()
    {
        return $this->service->ratingsIndex();
    }
}
