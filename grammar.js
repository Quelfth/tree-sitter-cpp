/**
 * @file C++ Grammar designed to be easy to query.
 * @author Quelfth <quelfth@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
    name: "cpp",

    word: $ => $.identifier,

    precedences: $ => [
        [
            'postfix',
            'prefix',
            'pointer-to-member',
            'multiplicative',
            'additive',
            'shift',
            'comparison',
            'relational',
            'equality',
            'bit-and',
            'bit-xor',
            'bit-or',
            'and',
            'or',
            'assignment',
        ],
        [
            'general_name',
            'specific_name',
        ],
        [
            'proper_scope',
            'lone_scope',
        ],
        [
            'proper-type',
            'type-modifier',
        ],
    ],

    conflicts: $ => [
        [$._function_declarator, $._variable_declarator],
        [$._template_argument, $.binary_expression],
        [$.short_type, $.primitive_type_modifier],
        [$.long_type, $.primitive_type_modifier],
        [$.signed_type, $.primitive_type_modifier],
        [$.unsigned_type, $.primitive_type_modifier],
        [$._type_root, $._weak_type],
        [$.scoped_name],
        [$._simple_type_modifier, $._weak_type],
        [$.cast_expression, $.sizeof_type_expression],
        [$.template_type_name, $.scoped_type_name],
    ],

    rules: {
        translation_unit: $ => repeat(
            $._declaration,
        ),

        _declaration: $ => choice(
            $.function_declaration,
            $.empty_declaration,
            $._statement_declaration,
        ),

        _statement_declaration: $ => choice(
            $.variable_declaration,
        ),

        empty_declaration: $ => seq(repeat($._attributes), ";"),

        function_declaration: $ => seq(
            $._declaration_type_modifiers,
            $._function_declarator,
            $._parameters_with_modifiers,
            optional($.trailing_return_type),
            choice(
                ";",
                $._function_body,
                seq("=", choice(
                    "0",
                    "default",
                    "delete",
                )),
            ),
        ),

        _function_declarator: $ => prec.left(seq(
            repeat($._any_pointer_modifier),
            choice(seq(optional($.scope), $.name), $.parenthesized_function_declarator),
            repeat(choice(
                $.function_type_modifier,
                $.array_type_modifier,
            )),
        )),

        parenthesized_function_declarator: $ => seq("(", $._function_declarator, ")"),


        _function_body: $ => $.block, // Add try body


        variable_declaration: $ => seq(
            $._declaration_type_modifiers,
            $._variable_declarator,
            optional($._variable_initializer),
            repeat(seq(
                ",",
                $._variable_declarator,
                optional($._variable_initializer),
            )),
            ";",
        ),


        _variable_declarator: $ => seq(
            repeat($._any_pointer_modifier),
            choice(seq(optional($.scope), $.name), $.parenthesized_variable_declarator),
        ),

        parenthesized_variable_declarator: $ => seq("(", $._variable_declarator, ")"),

        _variable_initializer: $ => choice(
            seq("=", $._initializer),
            seq("(", $._initializers, ")"),
            $.initializer_list,
        ),

        _empty_declaration: $ => seq(repeat($._attributes), ";"),

        _declaration_type_modifiers: $ => prec.left(seq(
            repeat($._attributes),
            repeat($._declaration_modifier),
            $._type_modifier,
            repeat(choice($._declaration_modifier, $._type_modifier)),
            repeat($._attributes),
        )),

        _template_modifier: $ => seq(
            "template",
            optional($.template_parameters),
        ),

        template_parameters: $ => seq(
            "<",
            optional(seq($._template_parameter, repeat(seq(",", $._template_parameter)))),
            ">",
        ),

        _template_parameter: $ => choice(
            $.parameter,
            $.type_parameter,
        ),

        template_arguments: $ => seq(
            "<",
            optional(seq($._template_argument, repeat(seq(",", $._template_argument)))),
            ">",
        ),

        _template_argument: $ => choice(
            $._type,
            $._expr,
        ),

        type_parameter: $ => choice(
            optional($._template_modifier),
            choice("class", "typename"), optional("..."),
            optional($.name),
            optional(seq("=", $._type)),
        ),

        _parameters_with_modifiers: $ => prec.right(seq(
            $.parameters,
            repeat($._attributes),
            repeat($._const_or_volatile_modifier),
            repeat($._any_reference_modifier),
        )),

        parameters: $ => seq("(", optional(seq($.parameter, repeat(seq(",", $.parameter)))), ")"),

        parameter: $ => choice(
            seq(
                $._type_root,
                $._variable_declarator,
            ),
            $._type,
        ),

        trailing_return_type: $ => seq("->", $._type),

        _initializers: $ => seq($._initializer, optional("..."), repeat(seq(",", $._initializer, optional("...")))),

        _initializer: $ => choice(
            $.initializer_list,
            $._expr,
        ),

        initializer_list: $ => seq(
            $._lbrace,
            $._initializers,
            $._rbrace,
        ),

        block: $ => seq($._lbrace, repeat($._statement), $._rbrace),

        _statement: $ => choice(
            $.labeled_statement,
            $.expression_statement,
            $.empty_statement,
            $.block,
            $.if_statement,
            $.switch_statement,
            $.while_statement,
            $.for_statement,
            $.break_statement,
            $.continue_statement,
            $.return_statement,
            $.goto_statement,
            $._statement_declaration,
            $.try_block,
        ),

        labeled_statement: $ => seq(
            repeat($._attributes),
            choice(
                $.name,
                "case", $._expr,
                "default",
            ),
            ":",
            $._statement,
        ),

        expression_statement: $ => seq($._expr, ";"),

        empty_statement: $ => ";",

        if_statement: $ => prec.right(seq(
            "if", "(",
            $._expr,
            ")",
            $._statement,
            optional(seq(
                "else",
                $._statement,
            )),
        )),

        switch_statement: $ => seq(
            "switch", "(",
            $._expr,
            ")",
            $._statement,
        ),

        while_statement: $ => choice(
            seq(
                "while", "(",
                $._expr,
                ")",
                $._statement,
            ),
            seq(
                "do",
                $._statement,
                "while", "(",
                $._expr,
                ")", ";",
            ),
        ),

        for_statement: $ => seq(
            "for", "(",
            choice(
                seq(
                    choice(
                        $.expression_statement,
                        $.variable_declaration,
                    ),
                    optional($._expr), ";",
                    optional($._expr),
                ),
                seq(
                    $._declaration_type_modifiers,
                    $._variable_declarator,
                    ":",
                    choice(
                        $._expr,
                        $.initializer_list,
                    ),
                ),
            ),
            ")",
            $._statement,
        ),

        break_statement: $ => seq("break", ";"),
        continue_statement: $ => seq("continue", ";"),
        return_statement: $ => seq(
            "return",
            optional(choice($._expr, $.initializer_list)),
            ";",
        ),
        goto_statement: $ => seq("goto", $.name, ";"),

        try_block: $ => seq(
            "try", $._lbrace,
            repeat($._statement),
            $._rbrace,
            repeat(seq(
                "catch", "(",
                choice(
                    seq(
                        repeat($._attributes),
                        choice(
                            seq($._type_root, $._variable_declarator),
                            $._type,
                        ),
                    ),
                    "...",
                ),
                ")",
                $._lbrace,
                repeat($._statement),
                $._rbrace,
            )),
        ),

        _expr_or_init: $ => prec.left(choice($._expr, $.initializer_list)),

        _expr: $ => choice(
            $.binary_expression,
            $.assignment_expression,
            $.conditional_expression,
            $.cast_expression,
            $.pre_unary_expression,
            $.post_unary_expression,
            $.sizeof_expression,
            $.sizeof_type_expression,
            $.sizeof_variadic_expression,
            $.alignof_expression,
            $.noexcept_expression,
            $.new_expression,
            $.delete_expression,
            $.index_expression,
            $.call_expression,
            $.constructor_expression,
            $.member_expression,
        ),

        binary_expression: $ => choice(
            prec.left(-1, seq($._expr, ",", $._expr)),
            prec.left('or', seq($._expr, $._2bar, $._expr)),
            prec.left('and', seq($._expr, $._2amper, $._expr)),
            prec.left('bit-or', seq($._expr, $._bar, $._expr)),
            prec.left('bit-xor', seq($._expr, $._caret, $._expr)),
            prec.left('bit-and', seq($._expr, $._amper, $._expr)),
            prec.left('equality', seq($._expr, "==", $._expr)),
            prec.left('equality', seq($._expr, "!=", $._expr)),
            prec.left('relational', seq($._expr, "<", $._expr)),
            prec.left('relational', seq($._expr, ">", $._expr)),
            prec.left('relational', seq($._expr, "<=", $._expr)),
            prec.left('relational', seq($._expr, ">=", $._expr)),
            prec.left('comparison', seq($._expr, "<=>", $._expr)),
            prec.left('shift', seq($._expr, "<<", $._expr)),
            prec.left('shift', seq($._expr, ">>", $._expr)),
            prec.left('additive', seq($._expr, "+", $._expr)),
            prec.left('additive', seq($._expr, "-", $._expr)),
            prec.left('multiplicative', seq($._expr, "*", $._expr)),
            prec.left('multiplicative', seq($._expr, "/", $._expr)),
            prec.left('multiplicative', seq($._expr, "%", $._expr)),
            prec.left('pointer-to-member', seq($._expr, ".*", $._expr)),
            prec.left('pointer-to-member', seq($._expr, "->*", $._expr)),
        ),

        assignment_expression: $ => prec.right('assignment', choice(
           seq($._expr, "=", $._expr_or_init),
            seq($._expr, "*=", $._expr_or_init),
            seq($._expr, "/=", $._expr_or_init),
            seq($._expr, "%=", $._expr_or_init),
            seq($._expr, "+=", $._expr_or_init),
            seq($._expr, "-=", $._expr_or_init),
            seq($._expr, ">>=", $._expr_or_init),
            seq($._expr, "<<=", $._expr_or_init),
            seq($._expr, $._amper_eq, $._expr_or_init),
            seq($._expr, $._caret_eq, $._expr_or_init),
            seq($._expr, $._bar_eq, $._expr_or_init),
        )),

        conditional_expression: $ => prec.right('assignment', seq($._expr, "?", $._expr, ":", $._expr)),

        cast_expression: $ => prec.right('prefix', seq("(", $._type, ")", $._expr)),

        pre_unary_expression: $ => prec.right('prefix', choice(
            seq("++", $._expr),
            seq("--", $._expr),
            seq("*", $._expr),
            seq($._amper, $._expr),
            seq("+", $._expr),
            seq("-", $._expr),
            seq($._bang, $._expr),
            seq($._tilde, $._expr), 
        )),

        sizeof_expression: $ => prec.right('prefix', seq("sizeof", $._expr)),
        sizeof_type_expression: $ => seq("sizeof", "(", $._type, ")"),
        sizeof_variadic_expression: $ => seq("sizeof", "...", "(", $.name, ")"),

        alignof_expression: $ => seq("alignof", "(", $._type, ")"),

        noexcept_expression: $ => seq(
            "noexcept",
            "(", $._expr, ")",
        ),

        new_expression: $ => prec.right('prefix', seq(
            optional("::"),
            "new",
            optional(seq("(", $._initializers, ")")),
            choice($._type, seq("(", $._type, ")")),
            choice(
                seq("(", $._initializers, ")"),
                $.initializer_list,
            ),
        )),

        delete_expression: $ => prec.right('prefix', seq(
            optional("::"),
            "delete",
            optional(seq($._lbracket, $._rbracket)),
            $._expr,
        )),

        index_expression: $ => prec.left('postfix', seq($._expr, $._lbracket, optional($._expr_or_init), $._rbracket)),

        call_expression: $ => prec.left('postfix', seq(choice($._expr, $._weak_type), "(", optional($._initializers), ")")),
        constructor_expression: $ => prec.left('postfix', seq($._weak_type, $.initializer_list)),

        member_expression: $ => prec.left('postfix', seq($._expr, choice(".", "->"), optional("template"), $._any_name)),

        post_unary_expression: $ => prec.left('postfix', choice(
            seq($._expr, "++"),
            seq($._expr, "--"),
        )),

        specific_cast_expression: $ => seq(
            choice(
                "dynamic_cast",
                "static_cast",
                "reinterpret_cast",
                "const_cast",
            ),
            "<", $._type, ">",
            "(", $._expr, ")",
        ),

        typeid_expression: $ => seq(
            "typeid", "(",
            choice($._expr, $._type),
            ")",
        ),

        decltype: $ => seq("decltype", "(", $._expr, ")"),

        _type: $ => prec.left(choice(
            $.function_type,
            $.array_type,
            $._type_left,
        )),

        function_type: $ => prec.left(seq(
            $._type,
            $._parameters_with_modifiers,
        )),

        array_type: $ => prec.left(seq(
            $._type,
            $._lbracket, optional($._expr), $._rbracket,
            repeat($._attributes),
        )),

        _type_left: $ => prec.left(choice(
            $.pointer_type,
            $.reference_type,
            $.rvalue_reference_type,
            $.pointer_to_member_type,
            seq($._type_root, repeat($._attributes)),
        )),

        pointer_type: $ => seq($._type_left, "*"),
        reference_type: $ => seq($._type_left, $._amper),
        rvalue_reference_type: $ => seq($._type_left, $._2amper),
        pointer_to_member_type: $ => seq($._type_left, $.scope, "*"),

        _type_root: $ => choice(
            $.primitive_type_name,
            $.short_type,
            $.long_type,
            $.signed_type,
            $.unsigned_type,
            $.const_type,
            $.specified_type_name,
            $.scoped_type_name,
            $.type_name,
            $.decltype,
        ),

        short_type: $ => prec.left('proper-type', choice(
            seq("short", $._type_root),
            "short",
            seq($._type_root, "short"),
        )),

        long_type: $ => prec.left('proper-type', choice(
            seq("long", $._type_root),
            "long",
            seq($._type_root, "long"),
        )),

        signed_type: $ => prec.left('proper-type', choice(
            seq("signed", $._type_root),
            "signed",
            seq($._type_root, "signed"),
        )),

        unsigned_type: $ => prec.left('proper-type', choice(
            seq("unsigned", $._type_root),
            "unsigned",
            seq($._type_root, "unsigned"),
        )),

        const_type: $ => prec.right(choice(
            seq("const", $._type_root),
            seq($._type_root, "const"),
        )),

        volatile_type: $ => prec.right(choice(
            seq("volatile", $._type_root),
            seq($._type_root, "volatile"),
        )),

        _any_pointer_modifier: $ => choice(
            $.pointer_modifier,
            $.reference_modifier,
            $.rvalue_reference_modifier,
            $.pointer_to_member_modifier,
        ),

        _any_reference_modifier: $ => choice(
            $.reference_modifier,
            $.rvalue_reference_modifier,
        ),

        _const_or_volatile_modifier: $ => choice(
            $.const_modifier,
            $.volatile_modifier,
        ),

        pointer_modifier: $ => "*",
        reference_modifier: $ => $._amper,
        rvalue_reference_modifier: $ => $._2amper,

        pointer_to_member_modifier: $ => seq(optional(seq($.name, $.scoped_name)), "::", "*"),

        function_type_modifier: $ => seq($._parameters_with_modifiers),
        array_type_modifier: $ => prec.left(seq($._lbracket, $._expr, $._rbracket, repeat($._attributes))),

        const_modifier: $ => "const",
        volatile_modifier: $ => "volatile",

        _declaration_modifier: $ => choice(
            $.register_modifier,
            $.static_modifer,
            $.thread_local_modifier,
            $.extern_modifier,
            $.mutable_modifier,
            $.inline_modifier,
            $.virtual_modifier,
            $.explicit_modifier,
        ),

        register_modifier: $ => "register",
        static_modifer: $ => "static",
        thread_local_modifier: $ => "thread_local",
        extern_modifier: $ => "extern",
        mutable_modifier: $ => "mutable",
        inline_modifier: $ => "inline",
        virtual_modifier: $ => "virtual",
        explicit_modifier: $ => "explicit",

        _type_modifier: $ => prec('type-modifier', choice(
            $._simple_type_modifier,
            $.specified_type_name,
            $._const_or_volatile_modifier,
        )),

        _simple_type_modifier: $ => choice(
            $.type_name,
            $.scoped_type_name,
            $.primitive_type_modifier,
            $.primitive_type_name,
            $.decltype,
        ),

        _attributes: $ => choice(
            $.attribute_modifier,
            $.alignas_modifier,
        ),

        attribute_modifier: $ => seq(
            $._lbracket, $._lbracket,
            repeat($.attribute),
            $._rbracket, $._rbracket,
        ),

        alignas_modifier: $ => seq(
            "alignas", "(",
            choice($._type, $._expr),
            optional("..."),
            ")",
        ),

        attribute: $ => prec.left(seq(
            optional(field("namespace", $.name)),
            field("name", alias($.name, $.attribute_name)),
            optional(field("arguments", $.attribute_arguments)),
        )),

        attribute_arguments: $ => seq("(", repeat($._meta_token), ")"),

        _meta_token: $ => choice(
            $.identifier_token,
            alias($.integer, $.integer_token),
            alias($.float, $.float_token),
            alias($.string, $.string_token),
            alias($.character, $.character_token),
            $.operator_token,
            $.delimited_token,
        ),

        identifier_token: $ => $.identifier,

        delimited_token: $ => choice(
            seq("(", repeat($._meta_token), ")"),
            seq("[", repeat($._meta_token), "]"),
            seq("{", repeat($._meta_token), "}"),
        ),

        operator_token: $ => choice(
            $._hash,
            $._2hash,
            ";",
            ":",
            "...",
            "?",
            "::",
            ".",
            ".*",
            "+",
            "-",
            "*",
            "/",
            "%",
            $._caret,
            $._amper,
            $._bar,
            $._tilde,
            $._bang,
            "=",
            "<",
            ">",
            "+=",
            "-=",
            "*=",
            "/=",
            "%=",
            $._caret_eq,
            $._amper_eq,
            $._bar_eq,
            "<<",
            ">>",
            "<<=",
            ">>=",
            "==",
            $._bang_eq,
            "<=",
            ">=",
            $._2amper,
            $._2bar,
            "++",
            "--",
            ",",
            "->*",
            "->",
        ),

        _weak_type: $ => choice(
            $.scoped_type_name,
            $.type_name,
            $.primitive_type_name,
            alias($.primitive_type_modifier, $.primitive_type_name),
            $.typename,
            $.decltype,
        ),

        primitive_type_modifier: $ => choice(
            "short",
            "long",
            "signed",
            "unsigned",
        ),

        primitive_type_name: $ => choice(
            "char",
            "char16_t",
            "char32_t",
            "wchar_t",
            "bool",
            "int",
            "float",
            "double",
            "void",
            "auto",
        ),

        type_specifier: $ => choice(
            "class",
            "enum",
            "struct",
            "union",
        ),

        integer: $ => /[0-9]+/,
        float: $ => /[0-9]+.[0-9]*/,
        string: $ => seq(
            '"',
            repeat($.string_content),
            '"',
        ),
        string_content: $ => /[^"]*/,
        character: $ => seq(
            "'",
            $.character_content,
            "'",
        ),
        character_content: $ => /[^']/,

        specified_type_name: $ => seq(
            field("specifier", $.type_specifier),
            field("name", choice($.type_name, $.scoped_type_name)),
        ),

        typename: $ => seq(
            "typename",
            choice($.type_name, $.scoped_type_name),
        ),

        template_type_name: $ => seq(
            optional("template"),
            $.type_name,
            $.template_arguments,
        ),

        template_name: $ => seq(
            optional("template"),
            $.name,
            $.template_arguments,
        ),
        
        template_operator_name: $ => seq(
            optional("template"),
            $.operator_name,
            $.template_arguments,
        ),

        template_destructor_name: $ => seq(
            optional("template"),
            $.destructor_name,
            $.template_arguments,
        ),

        _any_name: $ => choice(
            $.scoped_name,
            $.name,
            $.scoped_operator_name,
            $.operator_name,
            $.scoped_destructor_name,
            $.destructor_name,
        ),

        operator_name: $ => prec.left(seq(
            "operator",
            choice(
                $.overloadable_operator,
                seq('""', alias($.name, $.literal_suffix)),
                alias($._type, $.conversion_operator_type),
            ),
        )),

        destructor_name: $ => seq("~", $.type_name),

        scope: $ => prec('lone_scope', seq(optional(field("scope", choice($.name, $.scoped_name))), "::")),

        scoped_type_name: $ => prec('proper_scope', seq(optional(field("scope", choice($.name, $.scoped_name))), "::", field("name", choice($.type_name, $.template_type_name)))),
        scoped_name: $ => prec('proper_scope', seq(optional(field("scope", choice($.name, $.scoped_name))), "::", field("name", $.name))),
        scoped_operator_name: $ => prec('proper_scope', seq(optional(field("scope", choice($.name, $.scoped_name))), "::", field("name", $.operator_name))),
        scoped_destructor_name: $ => prec('proper_scope', seq(optional(field("scope", choice($.name, $.scoped_name))), "::", field("name", $.destructor_name))),

        name: $ => prec('general_name', $.identifier),

        type_name: $ => prec('specific_name', $.identifier),

        overloadable_operator: $ => prec.left(choice(
            "new",
            "delete",
            seq("new", $._lbracket, $._rbracket),
            seq("delete", $._lbracket, $._rbracket),
            "+",
            "-",
            "*",
            "/",
            "%",
            $._caret,
            $._amper,
            $._bar,
            $._tilde,
            $._bang,
            "=",
            "<",
            ">",
            "+=",
            "-=",
            "*=",
            "/=",
            "%=",
            $._caret_eq,
            $._amper_eq,
            $._bar_eq,
            "<<",
            ">>",
            "<<=",
            ">>=",
            "==",
            $._bang_eq,
            "<=",
            ">=",
            $._2amper,
            $._2bar,
            "++",
            "--",
            ",",
            "->*",
            "->",
            seq("(", ")"),
            seq($._lbracket, $._rbracket),
        )),

        identifier: $ => /[a-zA-Z_][a-zA-Z_0-9]*/,
                
        _lbracket: $ => choice("[", alias("<:", "[")),
        _rbracket: $ => choice("]", alias(":>", "]")),
        _lbrace: $ => choice("{", alias("<%", "{")),
        _rbrace: $ => choice("}", alias("%>", "}")),

        _2amper: $ => choice("&&", alias("and", "&&")),
        _amper_eq: $ => choice("&=", alias("and_eq", "&=")),
        _amper: $ => choice("&", alias("bitand", "&")),
        _bar: $ => choice("|", alias("bitor", "|")),
        _tilde: $ => choice("~", alias("compl", "~")),
        _bang: $ => choice("!", alias("not", "!")),
        _bang_eq: $ => choice("!=", alias("not_eq", "!=")),
        _2bar: $ => choice("||", alias("or", "||")),
        _bar_eq: $ => choice("|=", alias("or_eq", "|=")),
        _caret: $ => choice("^", alias("xor", "^")),
        _caret_eq: $ => choice("^=", alias("xor_eq", "^=")),

        _hash: $ => choice("#", alias("%:", "#")),
        _2hash: $ => choice("##", alias("%:%:", "##")),

    }
});
