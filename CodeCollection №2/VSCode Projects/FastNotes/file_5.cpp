#include <iostream>
#include <vector>

using namespace std;

int main() {
    
    vector<int> arr1 = {1, 3, 5, 6, 7};
    vector<int> arr2 = {1, 2, 5, 7, 8, 9};

    int amountElement = 0;

    for (size_t i = 0, j = 0; i + j < arr1.size() + arr2.size();)
    {
        if (arr1[i] == arr2[j])
        {
            amountElement++;
            i++;
            j++;
        }else if (arr1[i] > arr2[j] && i < arr1.size()){
            j++;
        } else if(j < arr2.size()){
            i++;
        } else{
            j++;
        }
    }
    cout << "==>" << amountElement;
    

    return 0;
}
