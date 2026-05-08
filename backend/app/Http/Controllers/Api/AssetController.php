<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Asset\AssetStoreRequest;
use App\Http\Requests\Asset\AssetUpdateRequest;
use App\Http\Resources\AssetResource;
use App\Models\Assets;

class AssetController extends Controller
{
    public function index()
    {
        $assets = Assets::all();

        return response()->json([
            'message' => 'Assets fetched successfully',
            'data'    => AssetResource::collection($assets),
        ], 200);
    }

    public function store(AssetStoreRequest $request)
    {
        $dataAsset = $request->validated();
        $asset = Assets::create($dataAsset);

        return response()->json([
            'message' => 'Asset created successfully',
            'data'    => new AssetResource($asset),
        ], 201);
    }

    public function update(AssetUpdateRequest $request, $id)
    {
        $asset = Assets::findOrFail($id);
        $dataAsset = $request->validated();

        $asset->update($dataAsset);

        return response()->json([
            'message' => 'Asset updated successfully',
            'data'    => new AssetResource($asset),
        ], 200);
    }

    public function destroy($id)
    {
        $asset = Assets::findOrFail($id);
        $asset->delete();

        return response()->json([
            'message' => 'Asset deleted successfully',
        ], 200);
    }
}
