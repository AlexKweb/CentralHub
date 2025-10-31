#include <iostream>
#include <cmath>
using namespace std;

// лонг лонг 8 байт 2^1023-1

int simpleNum(long long x) {
    for (int i = 2; i <= sqrt(x); i++) {
        if (x % i == 0) return 0;
        if (i == (int)(sqrt(x))) return x;
    }
}

int main() {
    int a, b;
    cout << "Enter limite of interval [1, 1023] : "<<endl;
    cin >> a >> b;
    for (; a < b; a++)
    {
        if (simpleNum(a))
        {
            if(simpleNum(pow(2, a) - 1))
            cout << " " << pow(2, a) - 1;
        }
    }
    return 0;
}



