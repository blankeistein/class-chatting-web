<?php

return [
    'groups' => [
        'auth' => [
            'login',
            'logout',
            'register',
            'password.request',
            'password.email',
            'password.reset',
            'password.update',
        ],
        'user' => [
            'user.*',
        ],
        'teacher' => [
            'teacher.*',
        ]
    ]
];
