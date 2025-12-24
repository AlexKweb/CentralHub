#include <iostream>
#include <iomanip>
#include <cmath>

using namespace std;

int main()
{
    const long double tolerance = 0.000000001;
    long double sum = 0.0;
    int k = 1;
    long double next = 0.0;

    while (true)
    {
        next = sum + ( (k % 2 == 0 ? 1.0 : -1.0) / ((2.0 * k - 1.0) * (2.0 * k - 1.0)) );

        if (fabsl(next - sum) < tolerance)
        {
            sum = next;
            break;
        }

        sum = next;
        ++k;
    }

    cout << fixed << setprecision(10);
    cout << "Sum: " << sum << endl;
}
