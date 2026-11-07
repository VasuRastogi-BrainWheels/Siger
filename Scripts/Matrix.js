
 
 /**
*@param {number[][]} mat 2D array called matrix

*/

export const Matrix=function (mat) {
  var M_matrix=
{
   
    data:mat,
    type:"SigerMatrix",
    row:mat.length,
    column:(mat)[0].length,
    /**
*@param {number} Rrow 2D array called matrix
*@param {number} Rcol 2D array called matrix
*@@return {Matrix} reshaped matrix 
*/

    reshape:function(Rrow,Rcol)
    {
      if(Rcol==-1&&Rrow==-1) return M_matrix// if both Rrow and Rcol are -1 return original matrix:)=
        
      if(Rrow==-1)Rrow=parseInt(M_matrix.row*M_matrix.column/Rcol)
      
      if(Rcol==-1)
        Rcol=parseInt(M_matrix.row*M_matrix.column/Rrow)//Auto calculate reshape row if reshaped column is -1
        
      
      if(Rrow*Rcol!=M_matrix.row*M_matrix.column)
      
        throw new Error("Reshape not possible with given row and column")
      
      let T_matrix=M_matrix.data//matrix to be reshaped
      trows=T_matrix.length
      tcols=T_matrix[0].length
      R_matrix=[]//reshaped matrix
      R_row=[]//contain data of single row of R_matrix when filled data is pushed in R_matrix
      for(let r=0;r<trows;r++)
      {
       for (let c=0;c<tcols;c++)
       {
         R_row.push(T_matrix[r][c])
         if(R_row.length==Rcol)
         {
           R_matrix.push(R_row)//when R_row is filled i.e has elements equal to reshaped cols its data is pushed in reshaped matrix
           R_row=[]
         }
       }
      }
      return new Matrix(R_matrix)
      
    },
    multiply:function (other)
    {
        let mat1=M_matrix.data//Matrix to multiply 
        let mat2=other.data//Matrix to be multiplied with
 
        var res=[]
        //product matrix
      
        var ResRow=[]
        let rows=mat1.length
        let columns=mat2[0].length
        if(mat1[0].length!=mat2.length)//Checking if matrix can be multiplied 
        {
          
          throw new Error("Can not multiply "+mat1.length+"x"+mat1[0].length+" with "+mat2.length+"x"+mat2[0].length+" matrix")
          return NaN
        }
      
        var r1=0;//rows of mat1
        var r2=0;//rows of mat2
        var c1=0;//coloumn of mat1
        var c2=0;//coloumn of mat2
        
        for ( let r1 = 0; r1<rows; r1++)
        {
           r2=0;
           c1=0;
           c2=0;//when 1st row of Matrix A is multipled with all columns of matrix B r2 c1 and c2 are set 0
        
            ResRow=[]//hold result of row of product when fully filled its data is pushed to res matrix and it itself became empty
            for ( let j = 0; j < mat2[0].length*mat2.length; j++) 
            {
                if(r2==0)
                {
                 ResRow.push(0)
                
                }
         
                ResRow[c2]+=mat1[r1][c1]*mat2[r2][c2]
                
                if(r2==mat1[0].length-1)
                {
                  c2+=1
                  r2=-1
                  c1=-1
                }
                r2+=1
                c1+=1
                

              
            }
            res.push(ResRow)//pushing row data in result matrix
            
        }
        return new Matrix(res)
    },//multiply function end
    any: function(matr)
    {//check if any element in matix is true if all are false rerurn false
      for ( let r=0;r<matr.row;r++)
      {
        for ( let c = 0; c < matr.column; c++)
        {
          if(matr.data[r][c])
          {
            return true
          }
          return false
        }//c for loop end
      }//r for loop ends
    },//End of Any function
    slice:function(row,col)
    {
     RowRedMatrix=M_matrix.data
     Res=[]
     for(let i=0;i<RowRedMatrix.length;i++)
     {
       Res.push(RowRedMatrix[i].splice(col[0],col[1]))
     }
     return new Matrix(Res)
    },
    inverse(){
      let mat=M_matrix.data
      
      
    },

    performEquals:function(param){
      matr=M_matrix
      for ( let r=0;r<matr.row;r++)
      {
        for ( let c = 0; c < matr.column; c++)
        {
          if(matr.data[r][c])
          {
            return true
          }
       
        }//c for loop end
      }//r for loop ends
      
      
    },//performeEquals end
    
   add:function(matr)
   {
      for ( let r=0;r<this.row;r++)
      {
        for ( let c = 0; c < this.column; c++)
        {
       
          this.data[r][c] += matr.data[r][c]
       
        }//c loop end
        
      }//r for loop ends
          
       
   }, //add func end
   
   multiplyNum:function(val)
   {
      const copy=new Matrix(this.data)
    
      for (let r=0;r<this.row;r++)
      {
        for (let c = 0; c < this.column; c++)
        {
       
          copy.data[r][c] *= val
          
        }//c loop end
        
      }//r for loop ends
       return copy
          
       
   } ,//Multiply with num func end
   sub:function(matr)
   {
      for ( let r=0;r<this.row;r++)
      {
        for ( let c = 0; c < this.column; c++)
        {
       
          this.data[r][c] -= matr.data[r][c]
       
        }//c loop end
        
      }//r for loop ends
          
       
   }, //subtract func end
   getFloat32Array(){
      const floatArray=new Float32Array(this.row*this.column)
      let index=-1
      for (let r=0;r<this.row;r++)
      {
        for (let c = 0; c < this.column; c++)
        {
          index++
       
          floatArray[index]=this.data[r][c]
          
        }//c loop end
        
      }//r for loop ends
       return floatArray

   }

  
  
}

  
  return M_matrix
}
