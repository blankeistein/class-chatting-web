<?php

namespace App\Http\Controllers\Admin\Apps\AnakIndonesiaMenghafal;

use App\Http\Controllers\Controller;
use Google\Cloud\Firestore\FirestoreClient;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class BookController extends Controller
{
    public function __construct(
        protected FirestoreClient $firestore,
    ) {}

    public function index(): Response
    {
        return Inertia::render('Admin/Apps/AnakIndonesiaMenghafal/Book/Index');
    }
}
