<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Location\LocationStoreRequest;
use App\Http\Resources\LocationResource;
use App\Models\Locations;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;

class LocationController extends Controller
{
    public function index()
    {
        $locations = Locations::all();

        return response()->json([
            'message' => 'Locations fetched successfully',
            'data'    => LocationResource::collection($locations),
        ], 200);
    }

    public function store(LocationStoreRequest $request)
    {
        $dataLocation = $request->validated();
        $location = Locations::create($dataLocation);

        return response()->json([
            'message' => 'Location created successfully',
            'data'    => new LocationResource($location),
        ], 201);
    }

    public function update(LocationStoreRequest $request, $id)
    {
        $location = Locations::findOrFail($id);
        $dataLocation = $request->validated();

        $location->update($dataLocation);

        return response()->json([
            'message' => 'Location updated successfully',
            'data'    => new LocationResource($location),
        ], 200);
    }

    public function destroy($id)
    {
        try {
            $location = Locations::findOrFail($id);
            $location->delete();

            return response()->json([
                'message' => 'Location deleted successfully',
            ], 200);
        } catch (QueryException $e) {
            if ($e->errorInfo[1] === 1451) {
                return response()->json([
                    'message' => 'Location cannot be deleted because it is still used by departments',
                ], 409);
            }

            return response()->json([
                'message' => 'Failed to delete location',
            ], 500);
        } catch (ModelNotFoundException $e) {
            return response()->json([
                'message' => 'Location not found',
            ], 404);
        }
    }
}
