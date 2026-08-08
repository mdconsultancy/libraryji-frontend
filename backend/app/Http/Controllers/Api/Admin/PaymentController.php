<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $payments = Payment::with(['member', 'subscription'])
            ->when($request->member_id, fn ($q) => $q->where('member_id', $request->member_id))
            ->when($request->status, fn ($q) => $q->where('status', $request->status))
            ->when($request->payment_method, fn ($q) => $q->where('payment_method', $request->payment_method))
            ->when($request->from && $request->to, fn ($q) => $q->whereBetween('paid_at', [$request->from, $request->to]))
            ->orderByDesc('paid_at')
            ->paginate($request->integer('per_page', 15));

        return response()->json($payments);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'member_id' => 'nullable|exists:members,id',
            'member_subscription_id' => 'nullable|exists:member_subscriptions,id',
            'type' => 'in:subscription,other',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'in:cash,card,upi,bank_transfer,razorpay,stripe,other',
            'status' => 'in:pending,paid,failed,refunded',
            'transaction_id' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
            'paid_at' => 'nullable|date',
        ]);

        $validated['invoice_number'] = $this->generateInvoiceNumber();
        $validated['status'] = $validated['status'] ?? 'paid';
        $validated['paid_at'] = $validated['paid_at'] ?? now();

        $payment = Payment::create($validated);

        return response()->json($payment->load(['member', 'subscription']), 201);
    }

    public function show(Payment $payment)
    {
        return response()->json($payment->load(['member', 'subscription']));
    }

    public function update(Request $request, Payment $payment)
    {
        $validated = $request->validate([
            'amount' => 'sometimes|required|numeric|min:0',
            'payment_method' => 'in:cash,card,upi,bank_transfer,razorpay,stripe,other',
            'status' => 'in:pending,paid,failed,refunded',
            'transaction_id' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $payment->update($validated);

        return response()->json($payment);
    }

    public function destroy(Payment $payment)
    {
        $payment->delete();

        return response()->json(['message' => 'Payment deleted successfully.']);
    }

    private function generateInvoiceNumber(): string
    {
        $tenantId = Auth::user()->tenant_id;

        return sprintf('INV-%d-%s', $tenantId, now()->format('YmdHis').random_int(100, 999));
    }
}
