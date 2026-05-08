<?php

namespace App\Http\Requests\Asset;

use Illuminate\Foundation\Http\FormRequest;

class AssetUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->role === "admin";
    }

    public function rules(): array
    {
        // route param lu: update($id)
        $id = $this->route('id') ?? $this->route('asset') ?? $this->id;

        return [
            // ✅ sekarang bisa update code (optional)
            'assets_code' => 'sometimes|required|string|unique:assets,assets_code,' . $id,

            'assets_name' => 'sometimes|required|string|max:255',
            'category'    => 'sometimes|required|string|max:100',
            'status'      => 'sometimes|required|string|in:available,checked_out,under_maintenance,retired',

            'model'       => 'sometimes|nullable|string|max:100',
            'checkin'     => 'sometimes|nullable|date',
            'checkout'    => 'sometimes|nullable|date|after_or_equal:checkin',
            'check_out_to'=> 'sometimes|nullable|string|max:255',
            'location'    => 'sometimes|nullable|exists:locations,id',
            'notes'       => 'sometimes|nullable|string',
        ];
    }
}
