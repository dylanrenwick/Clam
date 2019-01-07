# Clam
Token-based esolang that transpiles to JS

## Usage
Run with `node clam.js <code>` or `node clam.js -f <filepath>`  
Add the `-v` flag at the end to output transpiled JS instead of `eval`ing it

## The language
Clam is a token-based language. The transpiler iterates through each character of source code one by one and, provided it is a valid Clam token, calls a function that will output JS code corresponding to that token. Some tokens may also consume additional tokens after themselves.

Due to the forward-consuming nature of the token functions, all operations in Clam are prefix, meaning the operation to perform comes first, followed by a list of arguments.

For example:

```
+24
```
This will perform the plus `+` operation on `2` and `4`, and will output the JS code `2 + 4`.  
By default, all mathematical operators (`+-*/^%`) are *dyadic*, meaning they will consume the next 2 tokens. If you wish to provide more than 2 operands to an operator, see **Lists and Arguments** below

## Lists and Arguments
By default, all operations including functions and mathematical operators have an implicit arity. Unless told otherwise, they will consume a default amount of tokens after them as arguments. If you wish to provide more or fewer arguments, you must use list syntax. A `[` token is a special token that begins a list. The exact nature of the token depends on where it is being used.  
If it was reached by the main interpreter, and not as an argument to an operator, it will consume all tokens until it finds a closing `]`, then output a string of the tokens' values, separated by `, `.

For example:

```
["Hello""World"]
```
This will produce the JS code `'Hello, World'`  
However if the `[` token was reached as an argument to an operator, it acts as a list for that operator.

For example:

```
+[123456]
```
This will produce the JS code `1 + 2 + 3 + 4 + 5 + 6`

This functionality also works for passing arguments to functions. For example, using the print (`p`) function:

```
p["Hello"123"World"]
```
This will produce the JS code `console.log("Hello", 1, 2, 3, "World")`

Most functions, if not given an explicit list of arguments using the `[` token, will consume as few tokens as they need to properly operate. For example the `p` function can operate with only a single argument, and as such will only consume a single argument. However all mathematical operators require 2 arguments and as such will consume 2 arguments implicitly.  
*Note: Monadic operators such as `-` are not currently implemented, however if in the future they are added, mathematical operators will continue to be dyadic by default, requiring such a monadic operator to be passed a `[]` list containing only a single argument*

## Input and Output
Output in Clam is simple. The `p` function is used to output values to STDOUT, using JS's `console.log` function.

Input is only supported from STDIN, and works as follows:  
When the transpiler first starts, before attempting to transpile code, it will wait for input to be given. This input should be terminated with an EOF indicator (Ctrl+D on most terminals). After receiving an EOF indicator, the transpiler will stop listening for input, split the given input on newline, and pass the array of lines as arguments to the main function created by the transpiler. These can be read sequentially (FIFO, Queue style) using the `r` function. Each line may only be read once, as each call to `r` will increment the read lines pointer.

## Tokens
```
a - Read the next **character** in source code, convert it to an ASCII charcode, subtract 32, then use that value to index into the string dictionary (see dictionary.json) and return the corresponding string
e - Equality operator, concatenates given arguments with the '==' operator
i - Increment operator, currently the only implicitly monadic mathematical operator
p - Print (console.log)
r - Read from STDIN (See Input and Output above)
u - Consume the next token, return the string value of the token with the first letter uppercased
U - Consume the next token, append `.toUpperCase()` to its value
w - Consume the next 2 tokens, whie the first's value is truthy, evauate the second
? - Consume the next 2 tokens, if the first's value is truthy, evaluate the second
" - Basic string literal, consume all source code chars until the next ", then return as a string. Does not currently support escaped quotes
' - Consume the next token, surround its value in single quotes
[ - Begin a list, consume all tokens until the closing ], then return the items concatenated with ', ' (See lists and arguments above)
& - Logical AND operator, concatenates given arguments with the '&&' operator
| - Logical OR operator, concatenates given arguments with the '||' operator
```

## Golfing
As you can imagine, Clam is not amazing at golfing, but is naturally more terse than JS for anything its own operators can do.

Here's an example I experienced whilst developing a `Hello, World!` program:

Initial code:
```
=a*'ua+=a*+a*", "=a*+a*ua,=a*+a*"!"pa*
```
What this does:
```
=a*'ua+
=        Assignment
 a*      Dictionary access, * is ASCII char 42, which equates to index 10 in the dictionary, 'myVar'
   '     Surround next token's value in single quotes
    u    Uppercase first letter of next token's value
     a+  Dictionary access, + is ASCII char 43, which equates to index 11 in the dictionary, 'hello'
     
JS code:
myVar = 'Hello'

=a*+a*", "
=           Assignment
 a*         'myVar'
   +        Addition
    a*      'myVar'
      ", "  String literal, ', '
   
JS code:
myVar = myVar + ", "

=a*+a*ua,
=a*+a*     'myVar = myVar + '
      ua,  First letter uppercased of dictionary index 12, 'world'
      
JS code:
myVar = myVar + 'World'

=a*+a*"!"
=a*+a*     'myVar = myVar + '
      "!"  String literal, '!'
      
JS code:
myVar = myVar + "!"

pa*
p    Print
 a*  'myVar'
 
JS code:
console.log(myVar)
```
Very lengthy, and ultimately transpiles to the following:

```
function __clam_main(arguments) {
        myVar = 'Hello';
        myVar = myVar + ", ";
        myVar = myVar + World;
        myVar = myVar + "!";
        console.log(myVar);
}
__clam_main(...inputs);
```
(Note that the `__clam_main` function declaration and call are standard boilerplate applied by the transpiler)

This can definitely be shortened. Let's start by moving all of those additions onto a single line!
```
=a*+++'ua+", "ua,"!"pa*
```
This is 3 nested addition operators, and looks something like this:

```
myVar = 'Hello' + ", " + 'World' + "!"
console.log(myVar)
```
I'm sure by now you've also noticed the redundancy of `myVar`, let's fix that too:

```
p+++'ua+", "ua,"!"
```
Which becomes:
```
console.log('Hello' + ", " + 'World' + "!");
```
That's much better, but we can still do better by using the list `[]` operator.  
That pesky `", "` literal is taking up 5 chars. 4 for the literal and one for the additional addition operator needed, we can fix that by using a stand-alone list, like so:

```
[ua+ua,]
```
This transpiles to
```
'Hello, World'
```
Look at that, we managed to save another 2 characters, because the standalone list wraps its final value in single quotes, meaning we don't need the 2 `'` tokens anymore!

However, you can't implicitly pass a list *and* another argument to a mathematical operator, because they'll see the list and assume that's their argument list. So we still need a 2nd list for the arguments:
```
p+[[ua+ua,]"!"]
```
This is much better, and transpiles to this:
```
console.log('Hello, World' + "!");
```
However, I slightly lied about not being able to pass a list *and* another argument, as the mathematical operator will only treat the list as an argument list *if it comes immediately after the operator*  
Meaning you could do this:
```
+"!"[ua+ua,]
```
**However** this doesn't work for our case, as that would result in `!Hello, World` and then the `!` is on the wrong side! It's still useful info to remember for the future though.

So now our final `Hello, World!` program is simply
```
p+[[ua+ua,]"!"]
```
Which is *much* shorter than what we started out with!
