<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\BannerRequest;
use App\Http\Requests\Api\Admin\CategoryRequest;
use App\Http\Requests\Api\Admin\ComplaintReplyRequest;
use App\Http\Requests\Api\Admin\CouponRequest;
use App\Services\AdminService;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function __construct(private readonly AdminService $service)
    {
    }

    public function dashboard()
    {
        return $this->service->dashboard();
    }

    public function customersIndex(Request $request)
    {
        return $this->service->customersIndex($request);
    }

    public function customersShow(int $id)
    {
        return $this->service->customersShow($id);
    }

    public function customersBlock(int $id)
    {
        return $this->service->customersBlock($id);
    }

    public function customersUnblock(int $id)
    {
        return $this->service->customersUnblock($id);
    }

    public function customersOrders(int $id)
    {
        return $this->service->customersOrders($id);
    }

    public function vendorsIndex(Request $request)
    {
        return $this->service->vendorsIndex($request);
    }

    public function vendorsPending(Request $request)
    {
        return $this->service->vendorsPending($request);
    }

    public function vendorsShow(int $id)
    {
        return $this->service->vendorsShow($id);
    }

    public function vendorsApprove(int $id)
    {
        return $this->service->vendorsApprove($id);
    }

    public function vendorsReject(int $id)
    {
        return $this->service->vendorsReject($id);
    }

    public function vendorsSuspend(int $id)
    {
        return $this->service->vendorsSuspend($id);
    }

    public function vendorsCommission(Request $request, int $id)
    {
        return $this->service->vendorsCommission($request, $id);
    }

    public function vendorsDestroy(int $id)
    {
        return $this->service->vendorsDestroy($id);
    }

    public function vendorsVerifyDocuments(int $id)
    {
        return $this->service->vendorsVerifyDocuments($id);
    }

    public function restaurantsIndex(Request $request)
    {
        return $this->service->restaurantsIndex($request);
    }

    public function restaurantsShow(int $id)
    {
        return $this->service->restaurantsShow($id);
    }

    public function restaurantsSuspend(int $id)
    {
        return $this->service->restaurantsSuspend($id);
    }

    public function restaurantsActivate(int $id)
    {
        return $this->service->restaurantsActivate($id);
    }

    public function restaurantsUpdate(Request $request, int $id)
    {
        return $this->service->restaurantsUpdate($request, $id);
    }

    public function restaurantsDestroy(int $id)
    {
        return $this->service->restaurantsDestroy($id);
    }

    public function deliveryPartnersIndex(Request $request)
    {
        return $this->service->deliveryPartnersIndex($request);
    }

    public function deliveryPartnersPending(Request $request)
    {
        return $this->service->deliveryPartnersPending($request);
    }

    public function deliveryPartnersAvailable(Request $request)
    {
        return $this->service->deliveryPartnersAvailable($request);
    }

    public function deliveryRequestsIndex(Request $request)
    {
        return $this->service->deliveryRequestsIndex($request);
    }

    public function deliveryPartnersShow(int $id)
    {
        return $this->service->deliveryPartnersShow($id);
    }

    public function deliveryPartnersApprove(int $id)
    {
        return $this->service->deliveryPartnersApprove($id);
    }

    public function deliveryPartnersReject(int $id)
    {
        return $this->service->deliveryPartnersReject($id);
    }

    public function deliveryPartnersSuspend(int $id)
    {
        return $this->service->deliveryPartnersSuspend($id);
    }

    public function categoriesIndex()
    {
        return $this->service->categoriesIndex();
    }

    public function categoriesStore(CategoryRequest $request)
    {
        return $this->service->categoriesStore($request);
    }

    public function categoriesUpdate(CategoryRequest $request, int $id)
    {
        return $this->service->categoriesUpdate($request, $id);
    }

    public function categoriesDestroy(int $id)
    {
        return $this->service->categoriesDestroy($id);
    }

    public function foodItemsIndex(Request $request)
    {
        return $this->service->foodItemsIndex($request);
    }

    public function foodItemsShow(int $id)
    {
        return $this->service->foodItemsShow($id);
    }

    public function foodItemsDisable(int $id)
    {
        return $this->service->foodItemsDisable($id);
    }

    public function foodItemsEnable(int $id)
    {
        return $this->service->foodItemsEnable($id);
    }

    public function foodItemsDestroy(int $id)
    {
        return $this->service->foodItemsDestroy($id);
    }

    public function bannersIndex()
    {
        return $this->service->bannersIndex();
    }

    public function bannersStore(BannerRequest $request)
    {
        return $this->service->bannersStore($request);
    }

    public function bannersUpdate(BannerRequest $request, int $id)
    {
        return $this->service->bannersUpdate($request, $id);
    }

    public function bannersDestroy(int $id)
    {
        return $this->service->bannersDestroy($id);
    }

    public function bannersStatus(int $id)
    {
        return $this->service->bannersStatus($id);
    }

    public function ordersIndex(Request $request)
    {
        return $this->service->ordersIndex($request);
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

    public function ordersRefund(Request $request, int $id)
    {
        return $this->service->ordersRefund($request, $id);
    }

    public function couponsIndex()
    {
        return $this->service->couponsIndex();
    }

    public function couponsStore(CouponRequest $request)
    {
        return $this->service->couponsStore($request);
    }

    public function couponsUpdate(CouponRequest $request, int $id)
    {
        return $this->service->couponsUpdate($request, $id);
    }

    public function couponsDestroy(int $id)
    {
        return $this->service->couponsDestroy($id);
    }

    public function couponsStatus(int $id)
    {
        return $this->service->couponsStatus($id);
    }

    public function paymentsIndex(Request $request)
    {
        return $this->service->paymentsIndex($request);
    }

    public function commissionsIndex(Request $request)
    {
        return $this->service->commissionsIndex($request);
    }

    public function vendorPayoutsIndex(Request $request)
    {
        return $this->service->vendorPayoutsIndex($request);
    }

    public function vendorPayoutsStore(Request $request)
    {
        return $this->service->vendorPayoutsStore($request);
    }

    public function vendorPayoutsStatus(Request $request, int $id)
    {
        return $this->service->vendorPayoutsStatus($request, $id);
    }

    public function complaintsIndex(Request $request)
    {
        return $this->service->complaintsIndex($request);
    }

    public function complaintsShow(int $id)
    {
        return $this->service->complaintsShow($id);
    }

    public function complaintsReply(ComplaintReplyRequest $request, int $id)
    {
        return $this->service->complaintsReply($request, $id);
    }

    public function complaintsStatus(Request $request, int $id)
    {
        return $this->service->complaintsStatus($request, $id);
    }

    public function reportsDailySales()
    {
        return $this->service->reportsDailySales();
    }

    public function reportsMonthlyRevenue()
    {
        return $this->service->reportsMonthlyRevenue();
    }

    public function reportsVendorSales()
    {
        return $this->service->reportsVendorSales();
    }

    public function reportsCommission()
    {
        return $this->service->reportsCommission();
    }

    public function reportsCancellations()
    {
        return $this->service->reportsCancellations();
    }

    public function reportsPayments()
    {
        return $this->service->reportsPayments();
    }
}
