<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AssetResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'assets_code' => $this->assets_code,
            'assets_name' => $this->assets_name,
            'category' => $this->category,
            'model' => $this->model,
            'status' => $this->status,
            'check_out_to' => $this->check_out_to,
        ];
    }
}
