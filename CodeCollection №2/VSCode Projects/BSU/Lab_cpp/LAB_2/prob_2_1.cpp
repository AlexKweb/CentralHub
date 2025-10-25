#include <iostream>
#include <algorithm>
using namespace std;

int main() {
    int n;
    cout << "Enter: ";
    cin >> n;
    if (canFormPalindrome(n)) {
        cout << "may." << endl;
    } else {
        cout << "not may." << endl;
    }
    return 0;
}
