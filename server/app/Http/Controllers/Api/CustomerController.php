<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Auth\ProfileRequest;
use App\Http\Requests\Api\Customer\AddressRequest;
use App\Http\Requests\Api\Customer\CartItemRequest;
use App\Http\Requests\Api\Customer\CartItemUpdateRequest;
use App\Http\Requests\Api\Customer\CheckoutRequest;
use App\Http\Requests\Api\Customer\ComplaintRequest;
use App\Http\Requests\Api\Customer\CouponRequest;
use App\Http\Requests\Api\Customer\ReviewRequest;
use App\Services\CustomerService;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function __construct(private readonly CustomerService $service)
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

    public function addressesIndex()
    {
        return $this->service->addressesIndex();
    }

    public function addressesStore(AddressRequest $request)
    {
        return $this->service->addressesStore($request);
    }

    public function addressesUpdate(AddressRequest $request, int $id)
    {
        return $this->service->addressesUpdate($request, $id);
    }

    public function addressesDestroy(int $id)
    {
        return $this->service->addressesDestroy($id);
    }

    public function addressesDefault(int $id)
    {
        return $this->service->addressesDefault($id);
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

    public function cartShow()
    {
        return $this->service->cartShow();
    }

    public function cartSummary()
    {
        return $this->service->cartSummary();
    }

    public function cartStore(CartItemRequest $request)
    {
        return $this->service->cartStore($request);
    }

    public function cartUpdate(CartItemUpdateRequest $request, int $id)
    {
        return $this->service->cartUpdate($request, $id);
    }

    public function cartDestroy(int $id)
    {
        return $this->service->cartDestroy($id);
    }

    public function cartClear()
    {
        return $this->service->cartClear();
    }

    public function cartApplyCoupon(CouponRequest $request)
    {
        return $this->service->cartApplyCoupon($request);
    }

    public function checkout(CheckoutRequest $request)
    {
        return $this->service->checkout($request);
    }

    public function ordersIndex()
    {
        return $this->service->ordersIndex();
    }

    public function ordersShow(int $id)
    {
        return $this->service->ordersShow($id);
    }

    public function ordersTrack(int $id)
    {
        return $this->service->ordersTrack($id);
    }

    public function ordersCancel(int $id)
    {
        return $this->service->ordersCancel($id);
    }

    public function ordersReorder(int $id)
    {
        return $this->service->ordersReorder($id);
    }

    public function ordersInvoice(int $id)
    {
        return $this->service->ordersInvoice($id);
    }

    public function reviewsIndex()
    {
        return $this->service->reviewsIndex();
    }

    public function reviewsStore(ReviewRequest $request)
    {
        return $this->service->reviewsStore($request);
    }

    public function reviewsUpdate(ReviewRequest $request, int $id)
    {
        return $this->service->reviewsUpdate($request, $id);
    }

    public function reviewsDestroy(int $id)
    {
        return $this->service->reviewsDestroy($id);
    }

    public function complaintsIndex()
    {
        return $this->service->complaintsIndex();
    }

    public function complaintsStore(ComplaintRequest $request)
    {
        return $this->service->complaintsStore($request);
    }
}
