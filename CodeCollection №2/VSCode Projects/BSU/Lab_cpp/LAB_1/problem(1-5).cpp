#include <iostream>
using namespace std;
int main() {
    // ##Task 1
    {
        int a, b;
        std::cout << "##Task 1. Enter 2 numbers: " << endl;
        std::cin >> a >> b;
        int a_1 = a;
        int b_1 = b;
        while ((a != 0) && (b != 0))
        {
            if (a > b) { a = a % b; }
            else { b = b % a; }
        }
        std::cout << "nod: " << a + b << endl;
        std::cout << "nok: " << (long long)a_1 * b_1 / ((long long)a + (long long)b) << endl;
    }
    // ##Task 2
    {
        unsigned int a;
        cout << endl << "##Task 2. Enter the number a: " << endl;
        cin >> a;

        for (int i = 2; i <= sqrt(a); i++)
        {
            if (a % i == 0)
            {
                cout << "The number is not prime" << endl;
                break;
            }
            if (i == (int)(sqrt(a)))
            {
                cout << "The number is prime" << endl;
            }
        }
    }
    // ##Task 3
    {
        long long a, b;
        cout << endl << "##Task 3. Enter the beginning of the interval(1): ";
        if (!(cin >> a)) return 0;
        cout << "Enter the end of the interval(1.000.000): ";
        if (!(cin >> b)) return 0;
        if (a > b) { long long tmp = a; a = b; b = tmp; }
        if (a < 0) a = 0;
        cout << "Armstrong numbers in the interval [" << a << ", " << b << "]:\n";
        for (long long i = a; i <= b; ++i) {
            long long temp = i;
            int n = 0;
            if (temp == 0) { n = 1; }
            else {
                long long t = temp;
                while (t > 0) {
                    t /= 10;
                    ++n;
                }
            }
            long long sum = 0;
            long long temp_for_step = temp;
            if (temp_for_step == 0) {
                sum = 0;
            }
            else {
                while (temp_for_step > 0) {
                    int digit = temp_for_step % 10;
                    long long p = 1;
                    for (int k = 0; k < n; ++k) p *= digit; 
                    sum += p;
                    temp_for_step /= 10;
                }
            }

            if (sum == i) cout << i << " ";
        }
        cout << endl;
    }
    // ##Task 4
    {
        double a, b, c;
        cout << endl << "##Task 4. Enter the coefficients of the quadratic equation (a, b, c): ";
        cin >> a >> b >> c;

        if (a == 0) {
            if (b == 0) {
                if (c == 0) {
                    cout << "Infinitely many solutions (identity 0=0)." << endl;
                }
                else {
                    cout << "There are no solutions." << endl;
                }
            }
            else {
                double x = -c / b;
                cout << "Linear equation. Solution: x = " << x << endl;
            }
        }
        else {
            double D = b * b - 4 * a * c;

            if (D < 0) {
                cout << "no roots." << endl;
            }
            else if (D == 0) {
                double x = -b / (2 * a);
                cout << "One real root: x = " << x << endl;
            }
            else {
                double x1 = (-b + sqrt(D)) / (2 * a);
                double x2 = (-b - sqrt(D)) / (2 * a);
                cout << "Two real roots: x1 = " << x1 << ", x2 = " << x2 << endl;
            }
        }
    }
    // ##Task 5
    {
        int n;
        cout << endl << "##Task 5. Enter the number of decimal places: " << endl;
        cin >> n;

        long double sum = 0;
        for (int i = 1; i < n ; i++)
        {
            sum += ((i % 2 == 0) ? 1 : (-1)) / (2 * (double)i - 1) / (2 * (double)i - 1);
        }
        cout.precision(n);
        cout << "Sum: " << sum << endl;
        return 0;
    }

    return 0;
}



