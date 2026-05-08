<?php

namespace App\Http\Requests\Asset;

use Illuminate\Foundation\Http\FormRequest;

class AssetStoreRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->role === "admin";
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'assets_code' => 'required|string|unique:assets,assets_code',
            'assets_name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'status' => 'required|string|in:available,checked_out,under_maintenance,retired',
            'model' => 'nullable|string|max:100',
            'checkin' => 'nullable|date',
            'checkout' => 'nullable|date|after_or_equal:checkin',
            'check_out_to' => 'nullable|string|max:255',
            'location' => 'nullable|exists:locations,id',
            'notes' => 'nullable|string',
        ];
    }
}
