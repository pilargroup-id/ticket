<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Category\CategoryStoreRequest;
use App\Models\Categories;

class CategoryController extends Controller
{
    public function index()
    {
        $categories = Categories::all();

        return response()->json([
            'message' => 'Categories fetched successfully',
            'data'    => $categories,
        ], 200);
    }

    public function store(CategoryStoreRequest $request)
    {
        $dataCategory = $request->validated();
        $category = Categories::create($dataCategory);

        return response()->json([
            'message' => 'Category created successfully',
            'data'    => $category,
        ], 201);
    }

    public function update(CategoryStoreRequest $request, $id)
    {
        $category = Categories::findOrFail($id);
        $dataCategory = $request->validated();

        $category->update($dataCategory);

        return response()->json([
            'message' => 'Category updated successfully',
            'data'    => $category,
        ], 200);
    }

    public function destroy($id)
    {
        $category = Categories::findOrFail($id);
        $category->delete();

        return response()->json([
            'message' => 'Category deleted successfully',
        ], 200);
    }
}
