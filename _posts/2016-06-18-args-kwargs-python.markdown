---
layout: post
title:  "*args and **kwargs in python functions"
date:   2016-06-18 19:24:33 +0200
categories: python functions args
header-img: "img/python-args.jpg"

---

## * and *args
let's start with that simple function
{% highlight python %}
def sum_3(a, b, c):
    print(a+b+c)
{% endhighlight %}

{% highlight python %}
sum_3(1,2,3)
{% endhighlight %}
we get 
{% highlight python %}
6
{% endhighlight %}
but if we use this function with 2 args
{% highlight python%}
sum_3(1,2) # too little args 
{% endhighlight %}
we get an error for the missing argument 
{% highlight python %}
TypeError                                 Traceback (most recent call last)
<ipython-input-2-bc6e0dc1ceb4> in <module>()
----> 1 sum_3(1,2) # too little args

TypeError: sum_3() missing 1 required positional argument: 'c'
{% endhighlight %}
and here with 4 argument 
{% highlight python %}
sum_3(1,2,3,4) # too many args
{% endhighlight %}
we get an error for the argument issue
{% highlight python %}
TypeError                                 Traceback (most recent call last)
<ipython-input-3-6ed3f114fc0b> in <module>()
----> 1 sum_3(1,2,3,4) # too many args

TypeError: sum_3() takes 3 positional arguments but 4 were given
{% endhighlight %}
So, What is the deal when we want to make a function accepts any number
of argument without complaining ?
in this issue, pthon got the astric magic argument 
let's see what it can really do
{% highlight python %}
def sum_any(*args):
    sum = 0 
    for i in args :
        sum += i
    print(sum)
{% endhighlight %}
let's play with our new baby function and it's magic argument
{% highlight python %}
#accepts any num of args
sum_any(1)
sum_any(1,2,3)
sum_any(1,2,3,4,5,6)
sum_any(*[1,2,3,4,5,6]) # sum_any(1,2,3,4,5,6)
sum_any(*(1,2,3,4,5,6))
{% endhighlight %}

the result :
{% highlight python %}
1
6
21
21
21
{% endhighlight %}
so it seems that we have alot of magic here, the astrik argument
makes our function accept any number of argument and take them all
in a tuple so we can deal with any of them 

beside that we had some other shapes of passing those parameters like
sum_any(*[1,2,3,4,5,6]) that is equivalent to sum_any(1, 2, 3, 4, 5, 6)
and
sum_any(*(1,2,3,4,5,6)) is equivalent to sum_ny(1, 2, 3, 4, 5, 6)
that is what we call unpacking
we also can use the unpacking methode in the ordinary functions , but
we should take care of the number of the elements in the list we pass
{% highlight python %}
num_3 = [1, 2, 3]
num_4 = num_3+ [4]
sum_3(*num_3) # sum_3(1,2,3)
sum_3(*num_4)
{% endhighlight %}
the result :
{% highlight python %}
6

---------------------------------------------------------------------------
TypeError                                 Traceback (most recent call last)
<ipython-input-7-67a4778bddc3> in <module>()
      2 num_4 = num_3+ [4]
      3 sum_3(*num_3) # sum_3(1,2,3)
----> 4 sum_3(*num_4)

TypeError: sum_3() takes 3 positional arguments but 4 were given
{% endhighlight %}
we also can make a function takes ordinary and astrik argument ,
but we must make our ordinary argument the first one, because the
astrik argument takes all the arguments that comes after and if we 
put it in the first place it will take all the argument and always 
we will have a missing argument that have no data left
lets have an example
{% highlight python %}

def new_print(a, *args):
    for i in args:
        print(i)
    print("a = {0}".format(a))
new_print(1, 2,3, [5,4], "five")
{% endhighlight %}
the result
{% highlight python %}
2
3
[5, 4]
five
a = 1
{% endhighlight %}

## ** and **kwargs
the keyword argument (**kwargs) works like the single astrik one 
except that it needs a key and value for each argument 
{% highlight python %}
def try_kwargs( **kwargs):
    if 'one' in kwargs:
        print('hey we got ' + str(kwargs['one']))
    for key, value in kwargs.items() :
        print("key : {0} value : {1}".format(key, value))

try_kwargs(one=1, two=2)
{% endhighlight %}
the result : 

{% highlight python %}
hey we got 1
key : one value : 1
key : two value : 2
{% endhighlight %}

we can use both of them in one function !
{% highlight python %}
def try_args_kwargs(*args, **kwargs):
    for i in args :
        print (i)
    for key, value in kwargs.items() :
        
        print("key : {0} value : {1}".format(key, value))
try_args_kwargs(5, 7, 9, one=1, two=2)
{% endhighlight %}
the result : 
{% highlight python %}
5
7
9
key : one value : 1
key : two value : 2
{% endhighlight %}

Note:

{% highlight python %}
ls = [1,2,3]
x, y, z = ls
print(x)
print(y)
print(z)
a, *rest = ls
print(a)
print(rest)
*rest, b = ls 
print(b)
print(rest)
{% endhighlight %}
the result : 
{% highlight python %}

1
2
3
1
[2, 3]
3
[1, 2]
{% endhighlight %}
