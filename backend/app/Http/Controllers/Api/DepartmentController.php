<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Department\DepartmentStoreRequest;
use App\Http\Requests\Department\DepartmentUpdateRequest;
use App\Http\Resources\DepartmentResource;
use App\Models\Departments;
use Illuminate\Database\QueryException;

class DepartmentController extends Controller
{
    public function index()
    {
        $departments = Departments::with('location')->get();

        return response()->json([
            'message' => 'Departments fetched successfully',
            'data'    => DepartmentResource::collection($departments),
        ], 200);
    }

    public function store(DepartmentStoreRequest $request)
    {
        $dataDepartment = $request->validated();
        $department = Departments::create($dataDepartment);

        return response()->json([
            'message' => 'Department created successfully',
            'data'    => new DepartmentResource($department),
        ], 201);
    }

    public function update(DepartmentUpdateRequest $request, $id)
    {
        $department = Departments::findOrFail($id);
        $dataDepartment = $request->validated();

        $department->update($dataDepartment);

        return response()->json([
            'message' => 'Department updated successfully',
            'data'    => new DepartmentResource($department),
        ], 200);
    }

    public function destroy($id)
    {
        try {
            $department = Departments::findOrFail($id);
            $department->delete();

            return response()->json([
                'message' => 'Department deleted successfully',
            ], 200);
        } catch (QueryException $e) {
            if ($e->getCode() == '23000') {
                return response()->json([
                    'message' => 'Department cannot be deleted because it is linked to other data',
                ], 409);
            }

            return response()->json([
                'message' => 'Failed to delete department',
            ], 500);
        } catch (\Throwable $th) {
            return response()->json([
                'message' => 'Department not found',
            ], 404);
        }
    }
}
