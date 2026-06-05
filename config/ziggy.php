<?php

return [
    'groups' => [
        'auth' => [
            'auth.*',
            'login',
            'logout',
            'register',
            'password.request',
            'password.email',
            'password.reset',
            'password.update',
            'authenticate-firebase-user'
        ],
        'user' => [
            'user.*'
        ],
        'teacher' => [
            'teacher.*'
        ]
    ]
];
